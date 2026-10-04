import type { ProductVariant } from "@prisma/client";

import type { ProductVariantDTO } from "@/types/product";

/** Prisma `include` fragment that loads a product's variants in display order. */
export const variantsInclude = { orderBy: { order: "asc" as const } };

/** Decimal -> number so variants can cross the server/client boundary. */
export function toVariantDTOs(rows: ProductVariant[] | undefined): ProductVariantDTO[] {
  return (rows ?? []).map((v) => ({
    id: v.id,
    label: v.label,
    price: v.price === null ? null : Number(v.price),
    imageUrl: v.imageUrl,
  }));
}

/** Lowest price a product can be bought at: its own, or any cheaper variant's. */
export function lowestPrice(price: number, variants: ProductVariantDTO[] | undefined): number {
  const prices = (variants ?? []).map((v) => v.price ?? price);
  return prices.length > 0 ? Math.min(price, ...prices) : price;
}
