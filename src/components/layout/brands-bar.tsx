"use client";

import * as React from "react";
import Link from "next/link";

import { AutoScroller } from "@/components/layout/auto-scroller";
import { brandSlug } from "@/lib/brand-slug";
import { cn } from "@/lib/utils";
import type { BrandOptionDTO } from "@/types/product";

/** Thin auto-scrolling strip with every brand in the catalog. It scrolls
 * exactly like the offers strip (idle drift, edge run, hover hold, touch),
 * and each brand is a link to /marcas/<brand>, the page with all of that
 * brand's products. `activeSlug` highlights the brand whose page is open. */
export function BrandsBar({
  brands,
  activeSlug,
  className,
}: {
  brands: BrandOptionDTO[];
  activeSlug?: string;
  className?: string;
}) {
  // Two spellings of one brand (same slug) share a single link.
  const merged = React.useMemo(() => {
    const bySlug = new Map<string, BrandOptionDTO>();
    for (const b of brands) {
      const slug = brandSlug(b.name);
      if (!slug) continue;
      const prev = bySlug.get(slug);
      bySlug.set(slug, prev ? { name: prev.name, count: prev.count + b.count } : b);
    }
    return [...bySlug.values()];
  }, [brands]);

  if (merged.length === 0) return null;

  return (
    <nav aria-label="Marcas" className={cn("mb-3 sm:mb-4", className)}>
      <AutoScroller
        items={merged}
        getKey={(brand) => brand.name}
        trackClassName="items-center gap-2 py-1 sm:gap-2.5"
        cueClassName="h-6 w-6"
        minLoopItems={10}
        renderItem={(brand) => {
          const slug = brandSlug(brand.name);
          const active = slug === activeSlug;
          return (
            <Link
              href={`/marcas/${slug}`}
              draggable={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-xs font-semibold transition-colors sm:h-9 sm:px-4 sm:text-sm",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-secondary",
              )}
            >
              {brand.name}
              <span className={cn("text-[10px] font-medium sm:text-xs", active ? "opacity-80" : "text-muted-foreground")}>
                {brand.count}
              </span>
            </Link>
          );
        }}
      />
    </nav>
  );
}
