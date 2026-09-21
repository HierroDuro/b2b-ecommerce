import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, ChevronRight } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { InquireButton } from "@/components/products/inquire-button";
import { ProductImageGallery } from "@/components/products/product-image-gallery";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { siteConfig } from "@/config/site";

interface ProductPageParams {
  params: Promise<{ id: string }>;
}

/**
 * Same visibility rule as the public catalog API (see /api/products): only
 * an inactive product (an explicit admin toggle) is hidden from customers.
 * Out-of-stock products still get a page — see the "Disponible"/"No
 * disponible" badge below — since Consultar stays open on them (e.g. to
 * ask when they'll be back in stock).
 */
async function getVisibleProduct(id: string) {
  return prisma.product.findFirst({
    where: { id, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { order: "asc" } },
    },
  });
}

export async function generateMetadata({ params }: ProductPageParams): Promise<Metadata> {
  const { id } = await params;
  const product = await getVisibleProduct(id);

  if (!product) {
    return { title: "Producto no encontrado" };
  }

  const description = product.description.slice(0, 160);

  return {
    title: product.name,
    description,
    openGraph: {
      type: "website",
      title: product.name,
      description,
      images: [{ url: product.imageUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
    },
  };
}

export default async function ProductPage({ params }: ProductPageParams) {
  const { id } = await params;
  const product = await getVisibleProduct(id);

  if (!product) notFound();

  const gallery = [product.imageUrl, ...product.images.map((i) => i.url)];
  const price = Number(product.price);
  const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    image: gallery.map((url) => `${siteConfig.url}${url}`),
    offers: {
      "@type": "Offer",
      priceCurrency: "ARS",
      price,
      availability:
        product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url: `${siteConfig.url}/productos/${product.id}`,
    },
  };

  return (
    <div className="min-h-screen">
      <Header />
      {/* Static JSON-LD we build ourselves from trusted DB fields, not user input. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main
        className="mx-auto max-w-6xl px-6 pb-24 lg:px-10"
        style={{ paddingTop: "calc(var(--header-h) + 32px)" }}
      >
        <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Inicio
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span>{product.category.name}</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          <ProductImageGallery images={gallery} alt={product.name} />

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {product.isFeatured && (
                <Badge variant="highlight" className="gap-1 px-2.5 py-1">
                  <Star className="h-3 w-3 fill-current" />
                  Destacado
                </Badge>
              )}
              {product.isOnSale && (
                <Badge variant="destructive" className="px-2.5 py-1">
                  Oferta
                </Badge>
              )}
              <Badge variant={product.stock > 0 ? "success" : "danger"} className="px-2.5 py-1">
                {product.stock > 0 ? "Disponible" : "Agotado"}
              </Badge>
              <Badge variant="outline">{product.category.name}</Badge>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {product.name}
            </h1>

            <p className="text-sm text-muted-foreground">
              Marca <span className="font-medium text-foreground">{product.brand}</span>
            </p>

            <div className="flex flex-wrap items-baseline gap-3">
              {product.isOnSale && originalPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  {formatCurrency(originalPrice)}
                </span>
              )}
              <span className="text-3xl font-bold text-foreground">{formatCurrency(price)}</span>
            </div>

            <InquireButton
              productId={product.id}
              productName={product.name}
              size="lg"
              className="mt-1 w-full sm:w-auto"
            />

            <div className="mt-4 border-t border-border pt-4">
              <h2 className="text-sm font-semibold text-foreground">Descripción</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
