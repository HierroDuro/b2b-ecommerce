"use server";

import { revalidatePath } from "next/cache";
import { Prisma, ConversationStatus, MessageSenderType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireCustomerSession } from "@/lib/require-customer";
import { requireAdminSession } from "@/lib/require-admin";

const DEFAULT_INQUIRY_MESSAGE =
  "Hola, estoy interesado en este producto y quisiera realizar una consulta.";

/** How recent a typing timestamp has to be to still show "Escribiendo...". */
const TYPING_FRESHNESS_MS = 5000;

export type ChatActionResult =
  | { success: true; message?: string }
  | { success: false; message: string };

// ─────────────────────────────────────────────────────────────
// Access control helpers
//
// There is a single admin account (no separate "employee" role or
// per-conversation assignment) — any authenticated admin session can
// access any conversation. See requireAdminSession for the customer/admin
// session split this still relies on.
// ─────────────────────────────────────────────────────────────

async function loadConversationForAdmin(conversationId: string) {
  const session = await requireAdminSession();
  if (!session) return { session: null, conversation: null } as const;

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  return { session, conversation } as const;
}

// ─────────────────────────────────────────────────────────────
// Starting a conversation from the "Consultar" button
// ─────────────────────────────────────────────────────────────

export async function startConversation(
  productId: string,
  variantLabel?: string,
): Promise<
  | { success: true; conversationId: string; isNew: boolean; defaultMessage: string }
  | { success: false; message: string }
> {
  const session = await requireCustomerSession();
  if (!session) {
    return { success: false, message: "Necesitás iniciar sesión para consultar." };
  }

  // Only keep a variant that really belongs to this product — the label
  // comes from the client, so it can't be trusted to pick the price shown.
  let variant: string | null = null;
  if (variantLabel) {
    const match = await prisma.productVariant.findFirst({
      where: { productId, label: variantLabel },
      select: { label: true },
    });
    variant = match?.label ?? null;
  }

  // Each option is its own inquiry: asking about the 5 TB must not land in
  // an open conversation that was about the 1 TB.
  const existing = await prisma.conversation.findFirst({
    where: { userId: session.user.id, productId, variantLabel: variant, status: { not: "CLOSED" } },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return {
      success: true,
      conversationId: existing.id,
      isNew: false,
      defaultMessage: DEFAULT_INQUIRY_MESSAGE,
    };
  }

  const conversation = await prisma.conversation.create({
    data: { userId: session.user.id, productId, variantLabel: variant, status: "NEW" },
  });

  return {
    success: true,
    conversationId: conversation.id,
    isNew: true,
    defaultMessage: DEFAULT_INQUIRY_MESSAGE,
  };
}

// ─────────────────────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────────────────────

export async function sendMessage(
  conversationId: string,
  body: string,
  attachment?: { url: string; type: "image" | "pdf" | "audio" },
): Promise<ChatActionResult> {
  const trimmed = body.trim();
  if (!trimmed && !attachment) {
    return { success: false, message: "Escribí un mensaje." };
  }

  const customerSession = await requireCustomerSession();
  const adminSession = customerSession ? null : await requireAdminSession();

  if (!customerSession && !adminSession) {
    return { success: false, message: "No autorizado." };
  }

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) {
    return { success: false, message: "La conversación no existe." };
  }

  let senderType: MessageSenderType;
  let senderUserId: string | null = null;
  let senderAdminId: string | null = null;

  if (customerSession) {
    if (conversation.userId !== customerSession.user.id) {
      return { success: false, message: "No autorizado." };
    }
    senderType = "CUSTOMER";
    senderUserId = customerSession.user.id;
  } else {
    senderType = "EMPLOYEE";
    senderAdminId = adminSession!.user.id;
  }

  if (conversation.status === "CLOSED") {
    return {
      success: false,
      message: "Esta conversación está cerrada. Reabrila para poder responder.",
    };
  }

  // Ball-in-your-court status transitions: a customer message means staff
  // needs to look at it again; an admin reply means it's waiting on the
  // customer. Manual status changes (Resuelta, Cerrada) still override
  // this via updateConversationStatus.
  const nextStatus: ConversationStatus =
    senderType === "CUSTOMER"
      ? conversation.status === "NEW"
        ? "NEW"
        : "IN_PROGRESS"
      : "WAITING_CUSTOMER";

  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId,
        senderType,
        senderUserId,
        senderAdminId,
        body: trimmed,
        attachmentUrl: attachment?.url,
        attachmentType: attachment?.type,
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: nextStatus,
        ...(senderType === "CUSTOMER" ? { customerTypingAt: null } : { employeeTypingAt: null }),
      },
    }),
  ]);

  revalidatePath(`/consultas/${conversationId}`);
  revalidatePath(`/admin/consultas/${conversationId}`);
  return { success: true };
}

export async function getConversationMessages(conversationId: string) {
  const customerSession = await requireCustomerSession();
  const adminSession = customerSession ? null : await requireAdminSession();
  if (!customerSession && !adminSession) return null;

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return null;

  if (customerSession && conversation.userId !== customerSession.user.id) return null;

  const viewerType: MessageSenderType = customerSession ? "CUSTOMER" : "EMPLOYEE";
  const otherPartyType: MessageSenderType = viewerType === "CUSTOMER" ? "EMPLOYEE" : "CUSTOMER";

  // Second WhatsApp-style tick: as soon as this viewer's client fetches the
  // thread, whatever the other party sent has reached them — mark it
  // delivered. Whether it's also *read* (third tick, see markConversationRead)
  // depends on whether they're actually looking at the conversation.
  await prisma.message.updateMany({
    where: { conversationId, senderType: otherPartyType, deliveredAt: null },
    data: { deliveredAt: new Date() },
  });

  const [messages, refreshed] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: {
        senderUser: { select: { name: true } },
        senderAdmin: { select: { username: true } },
      },
    }),
    prisma.conversation.findUnique({ where: { id: conversationId } }),
  ]);

  const now = Date.now();
  const otherPartyTyping = refreshed
    ? viewerType === "CUSTOMER"
      ? refreshed.employeeTypingAt && now - refreshed.employeeTypingAt.getTime() < TYPING_FRESHNESS_MS
      : refreshed.customerTypingAt && now - refreshed.customerTypingAt.getTime() < TYPING_FRESHNESS_MS
    : false;

  return {
    status: refreshed?.status ?? conversation.status,
    viewerType,
    otherPartyTyping: Boolean(otherPartyTyping),
    messages: messages.map((m) => ({
      id: m.id,
      senderType: m.senderType,
      senderName: m.senderUser?.name ?? m.senderAdmin?.username ?? "—",
      body: m.body,
      attachmentUrl: m.attachmentUrl,
      attachmentType: m.attachmentType,
      deliveredAt: m.deliveredAt ? m.deliveredAt.toISOString() : null,
      readAt: m.readAt ? m.readAt.toISOString() : null,
      createdAt: m.createdAt.toISOString(),
      isOwn: m.senderType === viewerType,
    })),
  };
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const customerSession = await requireCustomerSession();
  const adminSession = customerSession ? null : await requireAdminSession();
  if (!customerSession && !adminSession) return;

  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return;
  if (customerSession && conversation.userId !== customerSession.user.id) return;

  const viewerType: MessageSenderType = customerSession ? "CUSTOMER" : "EMPLOYEE";

  await prisma.message.updateMany({
    where: { conversationId, senderType: { not: viewerType }, readAt: null },
    data: { readAt: new Date() },
  });
}

export async function setTyping(conversationId: string, isTyping: boolean): Promise<void> {
  const customerSession = await requireCustomerSession();
  const adminSession = customerSession ? null : await requireAdminSession();
  if (!customerSession && !adminSession) return;

  await prisma.conversation.update({
    where: { id: conversationId },
    data: customerSession
      ? { customerTypingAt: isTyping ? new Date() : null }
      : { employeeTypingAt: isTyping ? new Date() : null },
  });
}

// ─────────────────────────────────────────────────────────────
// Customer-facing conversation list
// ─────────────────────────────────────────────────────────────

export async function getCustomerConversations(search?: string) {
  const session = await requireCustomerSession();
  if (!session) return [];

  const conversations = await prisma.conversation.findMany({
    where: {
      userId: session.user.id,
      ...(search && {
        product: { name: { contains: search } },
      }),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      product: { select: { id: true, name: true, imageUrl: true, sku: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: {
        select: { messages: { where: { senderType: "EMPLOYEE", readAt: null } } },
      },
    },
  });

  return conversations.map((c) => ({
    id: c.id,
    status: c.status,
    product: c.product,
    variantLabel: c.variantLabel,
    lastMessage: c.messages[0]?.body ?? null,
    lastMessageAt: (c.messages[0]?.createdAt ?? c.createdAt).toISOString(),
    unreadCount: c._count.messages,
  }));
}

export async function getCustomerUnreadTotal(): Promise<number> {
  const session = await requireCustomerSession();
  if (!session) return 0;

  return prisma.message.count({
    where: {
      senderType: "EMPLOYEE",
      readAt: null,
      conversation: { userId: session.user.id },
    },
  });
}

export async function getConversationProductContext(conversationId: string) {
  const customerSession = await requireCustomerSession();
  const adminSession = customerSession ? null : await requireAdminSession();
  if (!customerSession && !adminSession) return null;

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      product: {
        include: {
          category: { select: { name: true } },
          variants: { orderBy: { order: "asc" } },
        },
      },
      user: { select: { name: true, email: true } },
    },
  });
  if (!conversation) return null;
  if (customerSession && conversation.userId !== customerSession.user.id) return null;

  // The option picked at inquiry time sets the price (and photo) the card
  // shows; a variant without its own price falls back to the product's.
  const variant = conversation.variantLabel
    ? conversation.product.variants.find((v) => v.label === conversation.variantLabel)
    : undefined;

  return {
    id: conversation.id,
    status: conversation.status,
    customer: conversation.user,
    product: {
      id: conversation.product.id,
      name: conversation.product.name,
      // SKU/stock are internal — only included when an admin is asking,
      // and omitted entirely (not just hidden in the UI) for customers.
      sku: adminSession ? conversation.product.sku : undefined,
      brand: conversation.product.brand,
      category: conversation.product.category.name,
      price: variant?.price != null ? Number(variant.price) : Number(conversation.product.price),
      variant: variant
        ? { optionName: conversation.product.optionName, label: variant.label }
        : undefined,
      stock: adminSession ? conversation.product.stock : undefined,
      imageUrl: variant?.imageUrl ?? conversation.product.imageUrl,
      isFeatured: conversation.product.isFeatured,
      isOnSale: conversation.product.isOnSale,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// Admin side
// ─────────────────────────────────────────────────────────────

export interface AdminConversationFilters {
  status?: ConversationStatus;
  productId?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

/** Populates the product/customer filter dropdowns with only the ones that
 * actually have at least one conversation, instead of the full catalog/customer base. */
export async function getConversationFilterOptions() {
  const session = await requireAdminSession();
  if (!session) return { products: [], customers: [] };

  // A conversation row exists as soon as a customer clicks "Consultar" and
  // logs in, before they've actually sent anything — exclude those from
  // everything admin-facing so an empty conversation never reads as a real
  // inquiry (see getAdminConversations / getAdminUnreadTotal below).
  const conversations = await prisma.conversation.findMany({
    where: { messages: { some: {} } },
    distinct: ["productId"],
    select: { product: { select: { id: true, name: true } } },
    orderBy: { product: { name: "asc" } },
  });

  const customerRows = await prisma.conversation.findMany({
    where: { messages: { some: {} } },
    distinct: ["userId"],
    select: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { name: "asc" } },
  });

  return {
    products: conversations.map((c) => c.product),
    customers: customerRows.map((c) => c.user),
  };
}

export async function getAdminConversations(filters: AdminConversationFilters) {
  const session = await requireAdminSession();
  if (!session) return [];

  const where: Prisma.ConversationWhereInput = {
    // Same rule as getConversationFilterOptions: a conversation with zero
    // messages is just a "Consultar" click + login, not an actual inquiry —
    // don't surface it to admin until the customer sends something.
    messages: { some: {} },
    ...(filters.status && { status: filters.status }),
    ...(filters.productId && { productId: filters.productId }),
    ...(filters.userId && { userId: filters.userId }),
    ...((filters.dateFrom || filters.dateTo) && {
      createdAt: {
        ...(filters.dateFrom && { gte: new Date(filters.dateFrom) }),
        ...(filters.dateTo && { lte: new Date(filters.dateTo) }),
      },
    }),
    ...(filters.search && {
      OR: [
        { product: { name: { contains: filters.search } } },
        { product: { sku: { contains: filters.search } } },
        { user: { name: { contains: filters.search } } },
        { user: { email: { contains: filters.search } } },
      ],
    }),
  };

  const conversations = await prisma.conversation.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      product: { select: { id: true, name: true, imageUrl: true, sku: true } },
      user: { select: { id: true, name: true, email: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: {
        select: { messages: { where: { senderType: "CUSTOMER", readAt: null } } },
      },
    },
  });

  return conversations.map((c) => ({
    id: c.id,
    status: c.status,
    product: c.product,
    variantLabel: c.variantLabel,
    customer: c.user,
    lastMessage: c.messages[0]?.body ?? null,
    lastMessageAt: (c.messages[0]?.createdAt ?? c.createdAt).toISOString(),
    unreadCount: c._count.messages,
  }));
}

export async function getAdminUnreadTotal(): Promise<number> {
  const session = await requireAdminSession();
  if (!session) return 0;

  return prisma.message.count({
    where: { senderType: "CUSTOMER", readAt: null },
  });
}

export async function updateConversationStatus(
  conversationId: string,
  status: ConversationStatus,
): Promise<ChatActionResult> {
  const { session, conversation } = await loadConversationForAdmin(conversationId);
  if (!session) return { success: false, message: "No autorizado." };
  if (!conversation) return { success: false, message: "La conversación no existe." };

  await prisma.conversation.update({ where: { id: conversationId }, data: { status } });
  revalidatePath(`/admin/consultas/${conversationId}`);
  revalidatePath("/admin/consultas");
  return { success: true };
}
