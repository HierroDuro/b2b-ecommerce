import type { Metadata } from "next";

import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/lib/prisma";
import { getExistingBrands } from "@/lib/brands";

export const metadata: Metadata = {
  title: "Nuevo producto",
  robots: { index: false, follow: false },
};

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    getExistingBrands(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Nuevo producto</h1>
        <p className="text-sm text-muted-foreground">Completá los datos del producto.</p>
      </div>
      <ProductForm categories={categories} brands={brands.map((b) => b.name)} />
    </div>
  );
}
