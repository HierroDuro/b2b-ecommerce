"use client";

import { SidebarFilters } from "@/components/layout/sidebar-filters";
import { MobileFiltersDialog } from "@/components/layout/mobile-filters-dialog";
import { ProductGrid } from "@/components/products/product-grid";
import { CuratedProductFeed } from "@/components/products/curated-product-feed";
import { useProductFilters } from "@/components/products/product-filters-context";
import type { BrandOptionDTO, CategoryDTO } from "@/types/product";

/**
 * Note: this does NOT wrap itself in a `ProductFiltersProvider` — the
 * provider lives once, at the root layout, so the header's search bar
 * (rendered as a sibling, outside this component) shares the exact same
 * filter state as the sidebar and grid below. See src/app/layout.tsx.
 */
export function Storefront({
  categories,
  brands,
}: {
  categories: CategoryDTO[];
  brands: BrandOptionDTO[];
}) {
  const { filters } = useProductFilters();

  // No search/filters active: show the curated, sectioned-by-category
  // homepage feed. The moment someone searches or filters, that curated
  // grouping stops making sense — fall back to the flat, sortable grid.
  const isDefaultView =
    !filters.search &&
    filters.categorySlugs.length === 0 &&
    filters.brands.length === 0 &&
    !filters.onSale &&
    !filters.featuredOnly &&
    filters.sort === "relevance";

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:gap-8">
      <SidebarFilters categories={categories} brands={brands} />
      <div className="flex-1">
        <div className="mb-4 lg:hidden">
          <MobileFiltersDialog categories={categories} brands={brands} />
        </div>
        {isDefaultView ? <CuratedProductFeed /> : <ProductGrid />}
      </div>
    </div>
  );
}
