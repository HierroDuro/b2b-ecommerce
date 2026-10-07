import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { resolveBrand } from "@/lib/brands";
import { productObjectSchema } from "@/lib/validations/product.schema";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Public: fetch a single active product (used by the admin edit form too). */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { order: "asc" } },
    },
  });

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ...product,
    price: Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    images: product.images.map((i) => i.url),
  });
}

/** Admin-only: update a product. */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = productObjectSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // `images`, when present, fully replaces the gallery (same contract as
  // the admin form's server action) — omit it from the body to leave the
  // existing gallery untouched on a partial update.
  const { images, variants, ...data } = parsed.data;
  if (data.brand !== undefined) data.brand = await resolveBrand(data.brand, id);

  try {
    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        ...(images !== undefined && {
          images: { deleteMany: {}, create: images.map((url, order) => ({ url, order })) },
        }),
        // Same contract as images: present = replace the whole list.
        ...(variants !== undefined && {
          variants: {
            deleteMany: {},
            create: variants.map((v, order) => ({ label: v.label, price: v.price, order })),
          },
        }),
      },
    });
    return NextResponse.json({
      ...updated,
      price: Number(updated.price),
      originalPrice: updated.originalPrice ? Number(updated.originalPrice) : null,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Ya existe un producto con ese SKU" }, { status: 409 });
    }
    throw error;
  }
}

/** Admin-only: delete a product. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await requireAdminSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }
    throw error;
  }
}
