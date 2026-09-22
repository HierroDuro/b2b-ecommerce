"use client";

import { useProductFilters } from "@/components/products/product-filters-context";

/**
 * The results grid sits well below the hero/showcase/offers — so typing a
 * search felt like it did nothing (or worse, on desktop the "Lo más barato
 * de la tienda" panel kept showing unrelated cheap products right under
 * the search box, which read as the search being broken). While a search
 * is active this collapses that intro on every screen size, so the actual
 * matching results appear right under the search bar instead.
 */
export function HideWhileSearching({ children }: { children: React.ReactNode }) {
  const { filters } = useProductFilters();
  return <div className={filters.search.trim() ? "hidden" : undefined}>{children}</div>;
}
