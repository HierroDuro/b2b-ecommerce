"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { InquireButton } from "@/components/products/inquire-button";
import { formatCurrency, truncate } from "@/lib/utils";
import { lowestPrice } from "@/lib/variants";
import type { ProductDTO } from "@/types/product";

/** Compact row layout used by the grid/list view toggle. */
export function ProductListItem({ product, index = 0 }: { product: ProductDTO; index?: number }) {
  const outOfStock = product.stock <= 0;
  const href = `/productos/${product.id}`;
  const variants = product.variants ?? [];
  const fromPrice = lowestPrice(product.price, variants);
  const pricesVary = variants.some((v) => (v.price ?? product.price) !== fromPrice) || product.price !== fromPrice;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index, 10) * 0.02 }}
      className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-soft transition-shadow hover:border-primary/30 hover:shadow-[0_14px_32px_-16px_hsl(var(--primary)/0.4)]"
    >
      <Link href={href} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-white">
        {product.isFeatured && (
          <Badge variant="highlight" className="absolute left-1 top-1 z-10 gap-0.5 px-1.5 py-0 text-[10px]">
            <Star className="h-2.5 w-2.5 fill-current" />
          </Badge>
        )}
        <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-2" />
      </Link>

      <div className="min-w-0 flex-1">
        <Link href={href}>
          <h3 className="truncate text-sm font-semibold text-foreground hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <p className="truncate text-xs text-muted-foreground">{truncate(product.description, 100)}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {product.isOnSale && (
            <Badge variant="destructive" className="px-2 py-0 text-[10px]">
              Oferta
            </Badge>
          )}
          <Badge variant={outOfStock ? "danger" : "success"} className="px-2 py-0 text-[10px]">
            {outOfStock ? "Agotado" : "Disponible"}
          </Badge>
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-2">
        <div className="flex flex-col items-end gap-0.5">
          {product.isOnSale && product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
          <span className="text-base font-bold text-foreground">
            {pricesVary && <span className="mr-1 text-xs font-normal text-muted-foreground">Desde</span>}
            {formatCurrency(fromPrice)}
          </span>
        </div>
        <InquireButton productId={product.id} productName={product.name} />
      </div>
    </motion.article>
  );
}
