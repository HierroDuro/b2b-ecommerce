"use client";

import * as React from "react";
import { Tag } from "lucide-react";

import { ProductCard } from "@/components/products/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCuratedFeed } from "@/hooks/use-curated-feed";

/** How many sections are visible up front, and how many more get revealed
 * each time the sentinel at the bottom scrolls into view. */
const INITIAL_SECTIONS = 2;
const SECTIONS_PER_REVEAL = 2;

/**
 * The homepage's default browsing feed (shown when no search/filters are
 * active — see Storefront): a few rows of one category, then the next,
 * cycling back through for a second batch, exactly as the curated API
 * response already orders them. "Infinite scroll" here is a progressive
 * reveal of sections already fetched in one request, not repeated network
 * calls — the whole catalog is small enough that this is simpler and just
 * as smooth.
 */
export function CuratedProductFeed() {
  const { data, isLoading, isError } = useCuratedFeed();
  const [visibleCount, setVisibleCount] = React.useState(INITIAL_SECTIONS);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  const totalSections = data?.sections.length ?? 0;

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + SECTIONS_PER_REVEAL, totalSections));
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [totalSections]);

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center text-sm text-destructive">
        Ocurrió un error al cargar los productos. Probá de nuevo en unos segundos.
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-10">
        {Array.from({ length: INITIAL_SECTIONS }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, j) => (
                <Skeleton key={j} className="aspect-[3/4.2] w-full rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const visibleSections = data.sections.slice(0, visibleCount);

  return (
    <div className="space-y-10">
      {visibleSections.map((section, sectionIndex) => {
        const isOfertas = section.categorySlug === "ofertas";
        return (
          <section key={`${section.categorySlug}-${sectionIndex}`} className="space-y-4">
            <h2 className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground">
              {isOfertas ? (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
                  <Tag className="h-3.5 w-3.5" />
                </span>
              ) : (
                <span
                  aria-hidden
                  className="h-6 w-1.5 rounded-full bg-gradient-to-b from-[hsl(var(--aurora-1))] to-[hsl(var(--aurora-2))]"
                />
              )}
              {section.categoryName}
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
              {section.products.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </section>
        );
      })}

      {visibleCount < totalSections && <div ref={sentinelRef} className="h-10" />}
    </div>
  );
}
