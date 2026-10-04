import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { toVariantDTOs } from "@/lib/variants";
import { productQuerySchema } from "@/lib/validations/product.schema";
import { fuzzyScore, productSearchText } from "@/lib/fuzzy-search";
import { sortAvailableFirst } from "@/lib/utils";
import type { ProductDTO, ProductListResponse } from "@/types/product";

/**
 * Public product listing endpoint — powers the storefront's real-time
 * search and filters. Everything here is read-only and safe to expose
 * without authentication; write operations live under /api/products/[id]
 * and are protected by the admin session (see that route + middleware.ts).
 *
 * All query params are parsed through Zod before touching Prisma, and all
 * filtering is expressed as typed Prisma `where` clauses (never raw SQL),
 * which is what actually prevents SQL injection here.
 *
 * Text search is typo-tolerant (see lib/fuzzy-search.ts) rather than a
 * plain SQL "contains": every non-text filter (category, brand, price,
 * onSale, featuredOnly) still runs in the database, but once a search term
 * is present, matching + ranking against that term happens in application
 * code so it works identically on SQLite (dev) and Postgres (prod) without
 * an engine-specific extension.
 *
 * Out-of-stock products are shown (marked "Agotado" client-side, see
 * ProductCard) rather than hidden — they're just sorted after everything
 * in stock (sortAvailableFirst). Because that ordering isn't expressible as
 * a portable Prisma `orderBy`, results are always fetched in full and
 * sorted/paginated in application code — fine at this catalog's size (low
 * hundreds of rows), same tradeoff the fuzzy search path already makes.
 */

function toDTO(
  p: Prisma.ProductGetPayload<{
    include: {
      category: { select: { id: true; name: true; slug: true } };
      images: true;
      variants: true;
    };
  }>,
): ProductDTO {
  return {
    ...p,
    price: Number(p.price),
    originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
    images: p.images.map((i) => i.url),
    variants: toVariantDTOs(p.variants),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function sortComparator(
  sort: "relevance" | "price-asc" | "price-desc" | "newest",
): (a: ProductDTO, b: ProductDTO) => number {
  switch (sort) {
    case "price-asc":
      return (a, b) => a.price - b.price;
    case "price-desc":
      return (a, b) => b.price - a.price;
    case "newest":
      return (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    case "relevance":
      return (a, b) => Number(b.isFeatured) - Number(a.isFeatured);
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const rawParams = {
    search: url.searchParams.get("search") ?? undefined,
    categorySlugs: url.searchParams.getAll("categorySlugs"),
    brands: url.searchParams.getAll("brands"),
    onSale: url.searchParams.get("onSale") ?? undefined,
    featuredOnly: url.searchParams.get("featuredOnly") ?? undefined,
    minPrice: url.searchParams.get("minPrice") ?? undefined,
    maxPrice: url.searchParams.get("maxPrice") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  };

  const parsed = productQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parámetros de búsqueda inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const query = parsed.data;

  // Deliberately excludes the search term — text matching happens in JS
  // below (see module doc comment) so it can be typo-tolerant. Deliberately
  // has no stock filter either — out-of-stock products stay visible (see
  // module doc comment) — only `isActive` (an explicit admin toggle) hides
  // a product entirely.
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    ...(query.categorySlugs.length > 0 && {
      category: { slug: { in: query.categorySlugs } },
    }),
    ...(query.brands.length > 0 && { brand: { in: query.brands } }),
    ...(query.onSale && { isOnSale: true }),
    ...(query.featuredOnly && { isFeatured: true }),
    ...((query.minPrice !== undefined || query.maxPrice !== undefined) && {
      price: {
        ...(query.minPrice !== undefined && { gte: query.minPrice }),
        ...(query.maxPrice !== undefined && { lte: query.maxPrice }),
      },
    }),
  };

  const [candidates, brandRows, priceAgg] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { order: "asc" } },
      variants: { orderBy: { order: "asc" } },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { brand: true },
      distinct: ["brand"],
      orderBy: { brand: "asc" },
    }),
    prisma.product.aggregate({
      where: { isActive: true },
      _min: { price: true },
      _max: { price: true },
    }),
  ]);

  let dtos = candidates.map(toDTO);

  if (query.search) {
    const scored = dtos
      .map((dto) => ({ dto, score: fuzzyScore(query.search, productSearchText(dto)) }))
      .filter((s) => s.score > 0);
    // "Relevance" while searching means fuzzy-match quality — leave that
    // order alone. Any other explicit sort (price, newest) still applies
    // to the matched set, same as it would with no search term.
    if (query.sort === "relevance") {
      scored.sort((a, b) => b.score - a.score);
    }
    dtos = scored.map((s) => s.dto);
  }

  if (!query.search || query.sort !== "relevance") {
    dtos.sort(sortComparator(query.sort));
  }

  dtos = sortAvailableFirst(dtos);

  const total = dtos.length;
  const paged = dtos.slice((query.page - 1) * query.pageSize, query.page * query.pageSize);

  const response: ProductListResponse = {
    products: paged,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    availableBrands: brandRows.map((b) => b.brand),
    priceRange: {
      min: priceAgg._min.price ? Number(priceAgg._min.price) : 0,
      max: priceAgg._max.price ? Number(priceAgg._max.price) : 0,
    },
  };

  return NextResponse.json(response);
}
