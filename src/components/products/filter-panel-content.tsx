"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useProductFilters } from "@/components/products/product-filters-context";
import type { BrandOptionDTO, CategoryDTO } from "@/types/product";

/**
 * Shared filter UI (categories, brands, En oferta, limpiar filtros). Products with
 * no stock are never sent by the API at all, so there is no "Con stock"
 * filter here — it would always be a no-op.
 * Rendered inside the sticky desktop sidebar and inside the mobile
 * filters dialog so both stay in sync automatically through context —
 * no duplicated state, just duplicated markup.
 */
export function FilterPanelContent({
  categories,
  brands,
}: {
  categories: CategoryDTO[];
  brands: BrandOptionDTO[];
}) {
  const { filters, toggleCategory, toggleBrand, setOnSale, clearAll, activeFilterCount } =
    useProductFilters();

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground">Filtros</h2>

      <div className="mt-6 space-y-4">
        <h3 className="text-sm font-medium text-foreground/90">Categorías</h3>
        <div className="space-y-3.5">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-2.5">
              <Checkbox
                id={`cat-${category.slug}`}
                checked={filters.categorySlugs.includes(category.slug)}
                onCheckedChange={() => toggleCategory(category.slug)}
              />
              <Label
                htmlFor={`cat-${category.slug}`}
                className="flex-1 cursor-pointer text-sm font-normal text-foreground/80"
              >
                {category.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {brands.length > 0 && (
        <>
          <Separator className="my-6" />

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground/90">Marcas</h3>
            <div className="space-y-3.5">
              {brands.map((brand) => {
                const id = `brand-${brand.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
                return (
                  <div key={brand.name} className="flex items-center gap-2.5">
                    <Checkbox
                      id={id}
                      checked={filters.brands.includes(brand.name)}
                      onCheckedChange={() => toggleBrand(brand.name)}
                    />
                    <Label
                      htmlFor={id}
                      className="flex flex-1 cursor-pointer items-center justify-between gap-2 text-sm font-normal text-foreground/80"
                    >
                      <span className="min-w-0 break-words">{brand.name}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {brand.count}
                      </span>
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <Separator className="my-6" />

      <div className="space-y-3.5">
        <div className="flex items-center gap-2.5">
          <Checkbox
            id="filter-on-sale"
            checked={filters.onSale}
            onCheckedChange={(checked) => setOnSale(Boolean(checked))}
          />
          <Label htmlFor="filter-on-sale" className="cursor-pointer text-sm font-normal text-foreground/80">
            En oferta
          </Label>
        </div>
      </div>

      <Separator className="my-6" />

      <Button
        variant="secondary"
        className="w-full justify-center text-sm font-medium"
        onClick={clearAll}
        disabled={activeFilterCount === 0 && !filters.search}
      >
        Limpiar todos los filtros
      </Button>
    </div>
  );
}
