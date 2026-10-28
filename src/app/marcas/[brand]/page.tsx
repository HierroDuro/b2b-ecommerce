import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BrandsBar } from "@/components/layout/brands-bar";
import { ProductCard } from "@/components/products/product-card";
import { prisma } from "@/lib/prisma";
import { brandSlug } from "@/lib/brand-slug";
import { getStorefrontBrands } from "@/lib/catalog-brands";
import { toVariantDTOs } from "@/lib/variants";
import type { ProductDTO } from "@/types/product";

// Same freshness as the home: stock and prices change often.
export const revalidate = 30;

interface BrandPageParams {
  params: Promise<{ brand: string }>;
}

/** Resolves the URL slug to the brand's displayed name (the most used spelling
 * among its active products) and the list of spellings that share that slug. */
async function resolveBrand(slug: string) {
  const brands = await getStorefrontBrands();
  const matches = brands.filter((b) => brandSlug(b.name) === slug);
  if (matches.length === 0) return null;
  const name = [...matches].sort((a, b) => b.count - a.count)[0]!.name;
  return { name, spellings: matches.map((m) => m.name), brands };
}

export async function generateMetadata({ params }: BrandPageParams): Promise<Metadata> {
  const { brand } = await params;
  const resolved = await resolveBrand(brand);
  if (!resolved) return { title: "Marca no encontrada" };
  return {
    title: `${resolved.name} — todos los productos`,
    description: `Productos de la marca ${resolved.name} disponibles en el catálogo.`,
  };
}

export default async function BrandPage({ params }: BrandPageParams) {
  const { brand: slug } = await params;
  const resolved = await resolveBrand(slug);
  if (!resolved) notFound();

  const rows = await prisma.product.findMany({
    where: { isActive: true, brand: { in: resolved.spellings } },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { order: "asc" } },
      variants: { orderBy: { order: "asc" } },
    },
  });

  // Available first, then A-Z, so what can be bought right now reads first.
  const products: ProductDTO[] = rows
    .map((p) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      images: p.images.map((i) => i.url),
      variants: toVariantDTOs(p.variants),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    }))
    .sort((a, b) => {
      if (a.stock > 0 !== b.stock > 0) return a.stock > 0 ? -1 : 1;
      return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
    });

  return (
    <div className="min-h-screen">
      <Header />
      <main
        className="mx-auto max-w-[1920px] px-6 pb-20 lg:px-10"
        style={{ paddingTop: "calc(var(--header-h) + 16px)" }}
      >
        <BrandsBar brands={resolved.brands} activeSlug={slug} />

        <nav aria-label="Breadcrumb" className="mb-5 mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Inicio
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>Marcas</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{resolved.name}</span>
        </nav>

        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          <span
            aria-hidden
            className="h-7 w-1.5 rounded-full bg-gradient-to-b from-[hsl(var(--aurora-1))] to-[hsl(var(--aurora-2))]"
          />
          {resolved.name}
        </h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{products.length}</span>{" "}
          {products.length === 1 ? "producto" : "productos"} de esta marca
        </p>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
