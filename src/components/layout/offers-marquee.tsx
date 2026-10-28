"use client";

import Image from "next/image";
import Link from "next/link";
import { Tag } from "lucide-react";

import { AutoScroller } from "@/components/layout/auto-scroller";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { ProductDTO } from "@/types/product";

/** Continuously scrolling strip of on-sale products. The scrolling behavior
 * (idle drift, edge run, hover hold, touch) lives in `AutoScroller`, which the
 * brands strip shares. */
export function OffersMarquee({ offers }: { offers: ProductDTO[] }) {
  if (offers.length === 0) return null;

  return (
    <div className="mb-10">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Tag className="h-4 w-4 text-primary" />
        Ofertas de la semana
      </h2>
      <AutoScroller
        items={offers}
        getKey={(product) => product.id}
        trackClassName="gap-3 lg:gap-5"
        renderItem={(product) => (
          <Link
            href={`/productos/${product.id}`}
            draggable={false}
            className="relative flex w-28 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-soft transition-shadow hover:border-primary/30 hover:shadow-card-hover sm:w-36 lg:w-56 xl:w-64"
          >
            <Badge
              variant="destructive"
              className="absolute left-1.5 top-1.5 z-10 gap-1 px-1.5 py-0 text-[9px] sm:left-2.5 sm:top-2.5 sm:px-2 sm:py-0.5 sm:text-[10px]"
            >
              <Tag className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              Oferta
            </Badge>
            <div className="relative aspect-square w-full bg-white">
              <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                sizes="256px"
                className="object-contain p-2 sm:p-4 lg:p-6"
              />
            </div>
            <div className="flex flex-1 flex-col gap-0.5 p-2 sm:gap-1 sm:p-2.5 lg:p-3.5">
              <p className="line-clamp-2 text-[11px] font-semibold leading-snug text-foreground sm:text-xs lg:text-sm">
                {product.name}
              </p>
              <div className="mt-auto flex flex-wrap items-baseline gap-1 pt-1 sm:gap-2">
                {product.originalPrice && (
                  <span className="text-[10px] text-muted-foreground line-through sm:text-xs">
                    {formatCurrency(product.originalPrice)}
                  </span>
                )}
                <span className="text-xs font-bold text-foreground sm:text-sm lg:text-base">
                  {formatCurrency(product.price)}
                </span>
              </div>
            </div>
          </Link>
        )}
      />
    </div>
  );
}
