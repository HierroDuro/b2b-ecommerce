import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { toVariantDTOs } from "@/lib/variants";
import { sortAvailableFirst } from "@/lib/utils";
import type { CategoryDTO, CuratedFeedResponse, CuratedSection, ProductDTO } from "@/types/product";

/** Categories that rotate through the homepage feed in this fixed order,
 * repeating (A→T→M→P→A→T→M→P→...) until every one is exhausted — see
 * CHUNK_SIZE below for how big each pass through a category is. */
const ROTATION_SLUGS = ["auriculares", "teclados", "mouses", "parlantes"];

/** "3 filas" at the grid's widest breakpoint (4 columns) — see
 * product-grid.tsx's `lg:grid-cols-4`. Smaller screens just wrap into more
 * visual rows for the same 12 items, which is normal responsive behavior. */
const CHUNK_SIZE = 12;

/**
 * Powers the homepage's default (no filters active) browsing feed: instead
 * of one flat list, visitors scroll through repeating category sections —
 * a few rows of Auriculares, then Teclados, then Mouses, then Parlantes,
 * then back to a *different* batch of Auriculares, and so on — with any
 * remaining categories (Resmas, Gráfica, etc.) appended at the end as a
 * single section each. Within every section, ofertas come first, then
 * destacados, then everything else — and out-of-stock products (shown as
 * "Agotado" rather than hidden, see ProductCard) are pushed after
 * all of that, so a section still leads with what's actually purchasable.
 *
 * A synthetic "Ofertas" section (not a real Category row — see the
 * `ofertas` slug below, guaranteed not to collide with a real category
 * slug) is prepended with every on-sale product across all categories, so
 * a discounted product is visible both there *and* in its own category
 * section further down — intentional duplication, not a bug.
 */
export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  const productsByCategory = new Map<string, ProductDTO[]>();
  for (const category of categories) {
    const products = await prisma.product.findMany({
      where: { isActive: true, categoryId: category.id },
      orderBy: [{ isOnSale: "desc" }, { isFeatured: "desc" }, { createdAt: "desc" }],
      include: { images: { orderBy: { order: "asc" } }, variants: { orderBy: { order: "asc" } } },
    });
    const dtos = products.map((p) => ({
      ...p,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      images: p.images.map((i) => i.url),
    variants: toVariantDTOs(p.variants),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      category: { id: category.id, name: category.name, slug: category.slug },
    }));
    productsByCategory.set(category.slug, sortAvailableFirst(dtos));
  }

  const categoryBySlug = new Map<string, CategoryDTO>(categories.map((c) => [c.slug, c]));
  const sections: CuratedSection[] = [];

  const cursors = new Map(ROTATION_SLUGS.map((slug) => [slug, 0]));
  let addedThisPass = true;
  while (addedThisPass) {
    addedThisPass = false;
    for (const slug of ROTATION_SLUGS) {
      const products = productsByCategory.get(slug) ?? [];
      const start = cursors.get(slug) ?? 0;
      if (start >= products.length) continue;

      const chunk = products.slice(start, start + CHUNK_SIZE);
      const category = categoryBySlug.get(slug);
      if (category && chunk.length > 0) {
        sections.push({ categorySlug: slug, categoryName: category.name, products: chunk });
        cursors.set(slug, start + CHUNK_SIZE);
        addedThisPass = true;
      }
    }
  }

  // Everything outside the rotation (Resmas, Gráfica, catch-all Tecnología,
  // future categories) gets appended as one trailing section each, in the
  // same oferta > destacado > resto order.
  for (const category of categories) {
    if (ROTATION_SLUGS.includes(category.slug)) continue;
    const products = productsByCategory.get(category.slug) ?? [];
    if (products.length === 0) continue;
    sections.push({ categorySlug: category.slug, categoryName: category.name, products });
  }

  // "Ofertas" — every on-sale product across the whole catalog, up front.
  // Each product still shows again in its own category section above.
  const onSaleProducts = sortAvailableFirst(
    Array.from(productsByCategory.values())
      .flat()
      .filter((p) => p.isOnSale),
  );
  if (onSaleProducts.length > 0) {
    sections.unshift({ categorySlug: "ofertas", categoryName: "Ofertas", products: onSaleProducts });
  }

  const response: CuratedFeedResponse = { sections };
  return NextResponse.json(response);
}
