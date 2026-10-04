import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductTable } from "@/components/admin/product-table";
import { prisma } from "@/lib/prisma";
import { toVariantDTOs } from "@/lib/variants";
import type { ProductDTO } from "@/types/product";

export const metadata: Metadata = {
  title: "Productos",
  robots: { index: false, follow: false },
};

async function getProducts(): Promise<ProductDTO[]> {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { order: "asc" } },
      variants: { orderBy: { order: "asc" } },
    },
  });

  return products.map((p) => ({
    ...p,
    price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    images: p.images.map((i) => i.url),
    variants: toVariantDTOs(p.variants),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
}

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Productos</h1>
          <p className="text-sm text-muted-foreground">{products.length} productos en total</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Link>
        </Button>
      </div>

      <ProductTable products={products} categories={categories} />
    </div>
  );
}
