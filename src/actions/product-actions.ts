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

  const { images, variants, ...data } = parsed.data;

  try {
    await prisma.product.create({
      data: {
        ...data,
        images: { create: images.map((url, order) => ({ url, order })) },
        variants: { create: variants.map((v, order) => ({ label: v.label, price: v.price, order })) },
      },
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

  const { images, variants, ...data } = parsed.data;

  // Variant photos aren't editable in the admin form, so a save would
  // wipe them with the delete+recreate below; carry each existing one over
  // to the variant that still has the same label.
  const existingVariantImages = new Map(
    (await prisma.productVariant.findMany({ where: { productId: id } })).map((v) => [v.label, v.imageUrl]),
  );

  try {
    // Replace the whole gallery on every save rather than diffing — product
    // galleries are small (max 8), so this is simpler than tracking which
    // individual images were added/removed/reordered.
    await prisma.product.update({
      where: { id },
      data: {
        ...data,
        images: { deleteMany: {}, create: images.map((url, order) => ({ url, order })) },
        // Same replace-the-whole-list approach as the gallery.
        variants: {
          deleteMany: {},
          create: variants.map((v, order) => ({
            label: v.label,
            price: v.price,
            order,
            imageUrl: existingVariantImages.get(v.label) ?? null,
          })),
        },
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

/** Quick single-field price edit used by the admin table's inline cell —
 * same idea as `updateProductStock`, kept separate rather than a generic
 * "patch one field" action so each keeps its own validation message. */
export async function updateProductPrice(id: string, price: number): Promise<ActionResult> {
  await ensureAdmin();

  if (!Number.isFinite(price) || price < 0) {
    return { success: false, message: "El precio no puede ser negativo." };
  }

  await prisma.product.update({ where: { id }, data: { price } });

  revalidatePath("/");
  revalidatePath("/admin/products");
  return { success: true, message: "Precio actualizado." };
}

/** Quick name edit from the admin table's inline cell. Same bounds as the
 * full form (see product.schema.ts) so both paths accept the same names. */
export async function updateProductName(id: string, name: string): Promise<ActionResult> {
  await ensureAdmin();

  const trimmed = name.trim();
  if (trimmed.length < 3) {
    return { success: false, message: "El nombre debe tener al menos 3 caracteres." };
  }
  if (trimmed.length > 160) {
    return { success: false, message: "El nombre es demasiado largo (máximo 160 caracteres)." };
  }

  try {
    await prisma.product.update({ where: { id }, data: { name: trimmed } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "El producto ya no existe." };
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath(`/productos/${id}`);
  revalidatePath("/admin/products");
  return { success: true, message: "Nombre actualizado." };
}

/** Quick SKU edit from the admin table's inline cell. SKU is free-form
 * (see product.schema.ts) but still unique, so this still has to handle
 * the same P2002 collision as the full edit form. */
export async function updateProductSku(id: string, sku: string): Promise<ActionResult> {
  await ensureAdmin();

  const trimmed = sku.trim();
  if (!trimmed) {
    return { success: false, message: "El SKU es obligatorio." };
  }

  try {
    await prisma.product.update({ where: { id }, data: { sku: trimmed } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { success: false, message: "Ya existe un producto con ese SKU." };
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "El producto ya no existe." };
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/admin/products");
  return { success: true, message: "SKU actualizado." };
}

/** Quick category reassignment from the admin table's inline cell. */
export async function updateProductCategory(id: string, categoryId: string): Promise<ActionResult> {
  await ensureAdmin();

  try {
    await prisma.product.update({ where: { id }, data: { categoryId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return { success: false, message: "El producto o la categoría ya no existen." };
    }
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
  return { success: true, message: "Categoría actualizada." };
}
