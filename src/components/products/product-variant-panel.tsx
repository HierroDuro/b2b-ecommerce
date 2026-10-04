"use client";

import * as React from "react";

import { InquireButton } from "@/components/products/inquire-button";
import { cn, formatCurrency } from "@/lib/utils";
import type { ProductVariantDTO } from "@/types/product";

interface ProductVariantPanelProps {
  productId: string;
  productName: string;
  price: number;
  originalPrice: number | null;
  isOnSale: boolean;
  optionName: string;
  variants: ProductVariantDTO[];
}

/**
 * Price + option picker + "Consultar" for the product page. When a product
 * has variants (e.g. the same cable in Blanco / Rosa) the shopper picks one
 * and the price follows it — each variant can carry its own price, falling
 * back to the product's. The chosen option is handed to the inquiry so the
 * seller knows which one the customer asked about. With no variants this
 * renders exactly the old price + button.
 */
export function ProductVariantPanel({
  productId,
  productName,
  price,
  originalPrice,
  isOnSale,
  optionName,
  variants,
}: ProductVariantPanelProps) {
  const [selectedId, setSelectedId] = React.useState<string | null>(variants[0]?.id ?? null);
  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const shownPrice = selected?.price ?? price;
  // The list price only matches the base product, so it's hidden once a
  // variant with its own price is picked.
  const showOriginal = isOnSale && originalPrice && (selected?.price ?? null) === null;

  return (
    <>
      <div className="flex flex-wrap items-baseline gap-3">
        {showOriginal && (
          <span className="text-lg text-muted-foreground line-through">
            {formatCurrency(originalPrice)}
          </span>
        )}
        <span className="text-3xl font-bold text-foreground">{formatCurrency(shownPrice)}</span>
      </div>

      {variants.length > 0 && (
        <div className="space-y-2" role="radiogroup" aria-label={optionName}>
          <p className="text-sm text-muted-foreground">
            {optionName}: <span className="font-medium text-foreground">{selected?.label}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const active = variant.id === selectedId;
              return (
                <button
                  key={variant.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelectedId(variant.id)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:border-primary/50",
                  )}
                >
                  {variant.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <InquireButton
        productId={productId}
        productName={productName}
        variantLabel={selected?.label}
        size="lg"
        className="mt-1 w-full sm:w-auto"
      />
    </>
  );
}
