import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/lib/prisma";
import { toVariantDTOs } from "@/lib/variants";

export const metadata: Metadata = {
  title: "Editar producto",
  robots: { index: false, follow: false },
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { order: "asc" } },
      variants: { orderBy: { order: "asc" } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!product) notFound();

  const productDTO = {
    ...product,
    price: Number(product.price),
    originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
    images: product.images.map((i) => i.url),
    variants: toVariantDTOs(product.variants),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Editar producto</h1>
        <p className="text-sm text-muted-foreground">{product.name}</p>
      </div>
      <ProductForm categories={categories} product={productDTO} />
    </div>
  );
}
