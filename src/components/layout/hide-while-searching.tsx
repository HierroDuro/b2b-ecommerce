"use client";

import { useProductFilters } from "@/components/products/product-filters-context";

/**
 * On phone/tablet the search bar sits at the very top, but the results grid
 * is far below the hero — so typing seemed to do nothing. While a search is
 * active this collapses the intro (below lg only) so the results appear
 * right under the search bar. Desktop keeps the intro as is.
 */
export function HideWhileSearching({ children }: { children: React.ReactNode }) {
  const { filters } = useProductFilters();
  return <div className={filters.search.trim() ? "hidden lg:block" : undefined}>{children}</div>;
}
