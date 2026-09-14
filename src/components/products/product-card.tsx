"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { InquireButton } from "@/components/products/inquire-button";
import { cn, formatCurrency, truncate } from "@/lib/utils";
import type { ProductDTO } from "@/types/product";

interface ProductCardProps {
  product: ProductDTO;
  /** Disables the mount fade-in; used when cards are appended, not the initial grid load. */
  index?: number;
}

/**
 * Product card: image gallery, "Destacado"/"Oferta"/"Disponible" badges,
 * name, short description, price and a "Consultar" action. This is a
 * catalog, not a store — there is no cart/buy flow, only an inquiry, and it
 * stays open even when out of stock (e.g. to ask when it's back). Hover/
 * entry animation is intentionally subtle (slight lift + shadow growth)
 * per the "elegant, not exaggerated" brief.
 */
export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const outOfStock = product.stock <= 0;
  const gallery = React.useMemo(
    () => [product.imageUrl, ...product.images],
    [product.imageUrl, product.images],
  );
  const [activeImage, setActiveImage] = React.useState(0);
  const href = `/productos/${product.id}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.03, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-shadow duration-300",
        "hover:border-primary/30 hover:shadow-[0_18px_40px_-16px_hsl(var(--primary)/0.45)]",
      )}
    >
      {/* Fixed white backdrop (not theme-reactive) — product photos are shot
          on white, so this stays white in dark mode too instead of clashing
          with the photo's own baked-in background. */}
      <Link href={href} className="relative block aspect-square w-full overflow-hidden bg-white">
        <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
          {product.isFeatured && (
            <Badge variant="highlight" className="gap-1 px-2.5 py-1 shadow-soft">
              <Star className="h-3 w-3 fill-current" />
              Destacado
            </Badge>
          )}
          {product.isOnSale && (
            <Badge variant="destructive" className="px-2.5 py-1 shadow-soft">
              Oferta
            </Badge>
          )}
          <Badge variant={outOfStock ? "danger" : "success"} className="px-2.5 py-1 shadow-soft">
            {outOfStock ? "Agotado" : "Disponible"}
          </Badge>
        </div>
        <Image
          src={gallery[activeImage] ?? product.imageUrl}
          alt={product.name}
          fill
          loading="lazy"
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          className="object-contain p-3 transition-transform duration-500 ease-out group-hover:scale-105 sm:p-6"
        />
        {gallery.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveImage((i) => (i - 1 + gallery.length) % gallery.length);
              }}
              aria-label={`Imagen anterior de ${product.name}`}
              className="absolute left-1.5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 p-1 opacity-0 shadow-soft transition-opacity hover:bg-background group-hover:opacity-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveImage((i) => (i + 1) % gallery.length);
              }}
              aria-label={`Imagen siguiente de ${product.name}`}
              className="absolute right-1.5 top-1/2 z-10 -translate-y-1/2 rounded-full bg-background/80 p-1 opacity-0 shadow-soft transition-opacity hover:bg-background group-hover:opacity-100"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}
        {gallery.length > 1 && (
          <div className="absolute inset-x-0 bottom-2 z-10 flex items-center justify-center gap-1.5">
            {gallery.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveImage(i);
                }}
                aria-label={`Ver imagen ${i + 1} de ${product.name}`}
                aria-current={i === activeImage}
                className={cn(
                  "h-1.5 rounded-full shadow-soft transition-all",
                  i === activeImage ? "w-4 bg-primary" : "w-1.5 bg-background/80 hover:bg-background",
                )}
              />
            ))}
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:gap-2 sm:p-5">
        <Link href={href}>
          <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-foreground hover:text-primary sm:text-sm">
            {product.name}
          </h3>
        </Link>
        {/* Description dropped below `sm` — at two cards per row there
            isn't room for it, and shoppers scan name + price first
            (Mercado Libre-style compact card); full details are one tap
            away on the product page. */}
        <p className="hidden text-xs text-muted-foreground sm:line-clamp-2 sm:block">
          {truncate(product.description, 90)}
        </p>

        <div className="mt-auto flex flex-col gap-2 pt-2 sm:gap-3 sm:pt-3">
          <div className="flex flex-wrap items-baseline gap-1.5 sm:gap-2">
            {product.isOnSale && product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through sm:text-sm">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
            <span className="text-base font-bold text-foreground sm:text-lg">
              {formatCurrency(product.price)}
            </span>
          </div>

          <InquireButton
            productId={product.id}
            productName={product.name}
            className="w-full px-2 text-xs sm:px-4 sm:text-sm"
          />
        </div>
      </div>
    </motion.article>
  );
}
