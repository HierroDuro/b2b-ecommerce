"use client";

import Image from "next/image";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useProductFilters } from "@/components/products/product-filters-context";
import { brandLogos } from "@/lib/brand-logos";
import { brandSlug } from "@/lib/brand-slug";
import { cn } from "@/lib/utils";
import type { BrandOptionDTO, CategoryDTO } from "@/types/product";

/**
 * Shared filter UI (categories, brands, En oferta, limpiar filtros). Products with
 * no stock are never sent by the API at all, so there is no "Con stock"
 * filter here — it would always be a no-op.
 * Rendered inside the sticky desktop sidebar and inside the mobile
 * filters dialog so both stay in sync automatically through context —
 * no duplicated state, just duplicated markup.
 *
 * `compact` is for the wide desktop panel in the hero: categories flow into
 * columns and brands become toggle chips, so the panel doesn't leave half of
 * its width empty. The narrow sidebar and the phone dialog keep the one-column
 * list.
 */
export function FilterPanelContent({
  categories,
  brands,
  showTitle = true,
  compact = false,
}: {
  categories: CategoryDTO[];
  brands: BrandOptionDTO[];
  showTitle?: boolean;
  compact?: boolean;
}) {
  const { filters, toggleCategory, toggleBrand, setOnSale, clearAll, activeFilterCount } =
    useProductFilters();

  const onSaleCheckbox = (
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
  );

  const clearButton = (
    <Button
      variant="secondary"
      className={cn("justify-center text-sm font-medium", !compact && "w-full")}
      size={compact ? "sm" : undefined}
      onClick={clearAll}
      disabled={activeFilterCount === 0 && !filters.search}
    >
      Limpiar todos los filtros
    </Button>
  );

  return (
    <div>
      {showTitle && <h2 className="text-base font-semibold text-foreground">Filtros</h2>}

      <div className={cn(showTitle ? "mt-6" : undefined, compact ? "space-y-3" : "space-y-4")}>
        <h3 className="text-sm font-medium text-foreground/90">Categorías</h3>
        <div className={compact ? "grid grid-cols-2 gap-x-6 gap-y-2.5" : "space-y-3.5"}>
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-2.5">
              <Checkbox
                id={`cat-${category.slug}`}
                checked={filters.categorySlugs.includes(category.slug)}
                onCheckedChange={() => toggleCategory(category.slug)}
              />
              <Label
                htmlFor={`cat-${category.slug}`}
                className="flex-1 cursor-pointer text-sm font-normal leading-snug text-foreground/80"
              >
                {category.name}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {brands.length > 0 && (
        <>
          <Separator className={compact ? "my-4" : "my-6"} />

          <div className={compact ? "space-y-3" : "space-y-4"}>
            <h3 className="text-sm font-medium text-foreground/90">Marcas</h3>
            <div className={compact ? "flex flex-wrap gap-2" : "space-y-3.5"}>
              {brands.map((brand) => {
                const id = `brand-${brand.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
                const slug = brandSlug(brand.name);
                const logo = brandLogos[slug];
                const checked = filters.brands.includes(brand.name);

                if (compact) {
                  // Toggle chip. Always white, like the brands strip: dark
                  // logos would vanish on the dark theme otherwise.
                  return (
                    <button
                      key={brand.name}
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      aria-label={brand.name}
                      title={`${brand.name} (${brand.count})`}
                      onClick={() => toggleBrand(brand.name)}
                      className={cn(
                        "flex h-9 items-center rounded-lg border bg-white px-3 shadow-soft transition",
                        checked
                          ? "border-primary ring-2 ring-primary/50"
                          : "border-border hover:border-primary/60",
                      )}
                    >
                      {logo ? (
                        <Image
                          src={`/brands/${slug}.png`}
                          alt=""
                          width={logo.w}
                          height={logo.h}
                          unoptimized
                          className="h-4 w-auto max-w-[7rem] select-none object-contain"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-slate-700">{brand.name}</span>
                      )}
                    </button>
                  );
                }

                return (
                  <div key={brand.name} className="flex items-center gap-2.5">
                    <Checkbox id={id} checked={checked} onCheckedChange={() => toggleBrand(brand.name)} />
                    <Label
                      htmlFor={id}
                      className="flex flex-1 cursor-pointer items-center justify-between gap-2 text-sm font-normal text-foreground/80"
                    >
                      {logo ? (
                        <span className="flex h-8 min-w-0 items-center rounded-md border border-border bg-white px-2.5 shadow-soft">
                          <Image
                            src={`/brands/${slug}.png`}
                            alt={brand.name}
                            width={logo.w}
                            height={logo.h}
                            unoptimized
                            className="h-4 w-auto max-w-[8rem] select-none object-contain"
                          />
                        </span>
                      ) : (
                        <span className="min-w-0 break-words">{brand.name}</span>
                      )}
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

      <Separator className={compact ? "my-4" : "my-6"} />

      {compact ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {onSaleCheckbox}
          {clearButton}
        </div>
      ) : (
        <>
          <div className="space-y-3.5">{onSaleCheckbox}</div>

          <Separator className="my-6" />

          {clearButton}
        </>
      )}
    </div>
  );
}
