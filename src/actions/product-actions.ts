"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { productSchema, type ProductInput } from "@/lib/validations/product.schema";

/**
 * Server Actions for the admin product CRUD.
 *
 * Next.js Server Actions are POST-only and Next automatically verifies the
 * request's Origin/Host headers against the deployment's allowed origins
 * before invoking the action body (see `experimental.serverActions.allowedOrigins`
 * in next.config.ts) — this is what actually stops a CSRF'd form on another
 * origin from silently calling these mutations.
 */

export type ActionResult =
  | { success: true; message: string }
  | { success: false; message: string; fieldErrors?: Record<string, string[]> };

async function ensureAdmin() {
  const session = await requireAdminSession();
  if (!session) {
    throw new Error("No autorizado");
  }
  return session;
}

export async function createProduct(input: ProductInput): Promise<ActionResult> {
  await ensureAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Revisá los campos marcados en el formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { images, ...data } = parsed.data;

  try {
    await prisma.product.create({
      data: { ...data, images: { create: images.map((url, order) => ({ url, order })) } },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "Ya existe un producto con ese SKU." };
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/admin/products");
  return { success: true, message: "Producto creado correctamente." };
}

export async function updateProduct(id: string, input: ProductInput): Promise<ActionResult> {
  await ensureAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Revisá los campos marcados en el formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { images, ...data } = parsed.data;

  try {
    // Replace the whole gallery on every save rather than diffing — product
    // galleries are small (max 8), so this is simpler than tracking which
    // individual images were added/removed/reordered.
    await prisma.product.update({
      where: { id },
      data: {
        ...data,
        images: { deleteMany: {}, create: images.map((url, order) => ({ url, order })) },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "El producto ya no existe." };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "Ya existe un producto con ese SKU." };
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/admin/products");
  return { success: true, message: "Producto actualizado correctamente." };
}

/** How many customer inquiries (chats) hang off a product — the admin
 * delete dialog asks this right before confirming, so it can warn that
 * deleting the product deletes those conversations too. */
export async function getProductConversationCount(id: string): Promise<number> {
  await ensureAdmin();
  return prisma.conversation.count({ where: { productId: id } });
}

/** Deletes a product. Conversations reference products with `onDelete:
 * Restrict` (so a chat can never silently lose the product it's about), so
 * a product that has inquiries is only deleted when the caller explicitly
 * passes `deleteConversations: true` — then its conversations (and their
 * messages, which cascade) go first, in the same transaction. */
export async function deleteProduct(
  id: string,
  options: { deleteConversations?: boolean } = {},
): Promise<ActionResult> {
  await ensureAdmin();

  try {
    const conversationCount = await prisma.conversation.count({ where: { productId: id } });
    if (conversationCount > 0 && !options.deleteConversations) {
      return {
        success: false,
        message: `Este producto tiene ${conversationCount} consulta${conversationCount === 1 ? "" : "s"}. Confirmá para eliminarlo junto con ellas.`,
      };
    }

    await prisma.$transaction([
      prisma.conversation.deleteMany({ where: { productId: id } }),
      prisma.product.delete({ where: { id } }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "El producto ya no existe." };
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/admin/products");
  revalidatePath("/admin/consultas");
  return { success: true, message: "Producto eliminado." };
}

/** Quick single-field toggles used by the admin table's inline switches. */
export async function toggleProductFlag(
  id: string,
  flag: "isFeatured" | "isActive" | "isOnSale",
  value: boolean,
): Promise<ActionResult> {
  await ensureAdmin();

  // Built as an explicit switch (rather than a computed `{ [flag]: value }`)
  // so the Prisma update payload stays a properly typed literal instead of
  // a loose indexed object.
  switch (flag) {
    case "isFeatured":
      await prisma.product.update({ where: { id }, data: { isFeatured: value } });
      break;
    case "isActive":
      await prisma.product.update({ where: { id }, data: { isActive: value } });
      break;
    case "isOnSale":
      await prisma.product.update({ where: { id }, data: { isOnSale: value } });
      break;
  }

  revalidatePath("/");
  revalidatePath("/admin/products");
  return { success: true, message: "Cambio guardado." };
}

export async function updateProductStock(id: string, stock: number): Promise<ActionResult> {
  await ensureAdmin();

  if (!Number.isInteger(stock) || stock < 0) {
    return { success: false, message: "El stock debe ser un entero mayor o igual a 0." };
  }

  await prisma.product.update({ where: { id }, data: { stock } });

  revalidatePath("/");
  revalidatePath("/admin/products");
  return { success: true, message: "Stock actualizado." };
}
