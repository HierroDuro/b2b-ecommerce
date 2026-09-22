"use client";

import { OffersMarquee } from "@/components/layout/offers-marquee";
import { Storefront } from "@/components/products/storefront";
import { useProductFilters } from "@/components/products/product-filters-context";
import type { CategoryDTO, ProductDTO } from "@/types/product";

/**
 * Arranges "Ofertas de la semana" and the product grid/filters — the
 * relative order between the two flips depending on whether a search is
 * active:
 *  - no search: the marquee comes first, as a browse-and-discover strip
 *    before the curated, sectioned homepage feed;
 *  - searching: the marquee would otherwise sit between the search box and
 *    the matching results, which reads as clutter in the way of what was
 *    just searched for — so it drops to the very bottom of the catalog
 *    instead, after the results, rather than disappearing outright.
 */
export function CatalogSection({
  categories,
  offers,
}: {
  categories: CategoryDTO[];
  offers: ProductDTO[];
}) {
  const { filters } = useProductFilters();
  const isSearching = filters.search.trim().length > 0;

  if (isSearching) {
    return (
      <>
        <Storefront categories={categories} />
        <div className="mt-14">
          <OffersMarquee offers={offers} />
        </div>
      </>
    );
  }

  return (
    <>
      <OffersMarquee offers={offers} />
      <Storefront categories={categories} />
    </>
  );
}
