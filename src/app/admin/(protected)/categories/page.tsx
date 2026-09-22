import type { Metadata } from "next";

import { CategoryManager } from "@/components/admin/category-manager";
import { prisma } from "@/lib/prisma";
import type { ProductDTO } from "@/types/product";

export const metadata: Metadata = {
  title: "Categorías",
  robots: { index: false, follow: false },
};

/** Every product, category included — small "view + edit" cards for the
 * expandable list on each category row, filtered client-side by
 * `category.id`. Same full-catalog-loaded-once approach `ProductTable`
 * already uses on the Productos page; fine at this catalog's size. */
async function getProducts(): Promise<ProductDTO[]> {
  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { order: "asc" } },
    },
  });

  return products.map((p) => ({
    ...p,
    price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    images: p.images.map((i) => i.url),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
}

export default async function AdminCategoriesPage() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    }),
    getProducts(),
  ]);

  const categoriesDTO = categories.map((c) => ({
    ...c,
    productCount: c._count.products,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Categorías</h1>
        <p className="text-sm text-muted-foreground">
          Administrá las categorías del catálogo.
        </p>
      </div>
      <CategoryManager categories={categoriesDTO} products={products} />
    </div>
  );
}
