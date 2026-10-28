"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { AutoScroller } from "@/components/layout/auto-scroller";
import { brandSlug } from "@/lib/brand-slug";
import { brandLogos } from "@/lib/brand-logos";
import { cn } from "@/lib/utils";
import type { BrandOptionDTO } from "@/types/product";

/** Thin auto-scrolling strip with every brand in the catalog. It scrolls
 * exactly like the offers strip (idle drift, edge run, hover hold, touch),
 * and each brand is a link to /marcas/<brand>, the page with all of that
 * brand's products. Brands show their transparent PNG logo (see
 * lib/brand-logos.ts) and fall back to the name when there is none.
 * `activeSlug` highlights the brand whose page is open. */
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
        trackClassName="items-center gap-2 py-1.5 sm:gap-3"
        cueClassName="h-6 w-6"
        minLoopItems={10}
        renderItem={(brand) => {
          const slug = brandSlug(brand.name);
          const active = slug === activeSlug;
          const logo = brandLogos[slug];
          return (
            <Link
              href={`/marcas/${slug}`}
              draggable={false}
              aria-label={brand.name}
              title={brand.name}
              aria-current={active ? "page" : undefined}
              className={cn(
                // Always a white chip (like the site logo): dark logos (HP,
                // Epson...) would vanish on the dark theme otherwise.
                "inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full border bg-white px-4 shadow-soft transition-all hover:-translate-y-px hover:border-primary/50 sm:h-12 sm:px-5",
                active ? "border-primary ring-2 ring-primary" : "border-border",
              )}
            >
              {logo ? (
                <Image
                  src={`/brands/${slug}.png`}
                  alt={brand.name}
                  width={logo.w}
                  height={logo.h}
                  unoptimized
                  draggable={false}
                  className="h-5 w-auto select-none sm:h-6"
                />
              ) : (
                <span className="text-xs font-bold uppercase tracking-wide text-slate-700 sm:text-sm">
                  {brand.name}
                </span>
              )}
            </Link>
          );
        }}
      />
    </nav>
  );
}
