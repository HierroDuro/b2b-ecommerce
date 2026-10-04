import Image from "next/image";
import Link from "next/link";
import { Star, PackageX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency } from "@/lib/utils";

interface ProductMiniCardProps {
  id: string;
  name: string;
  /** Admin-only — customers must never see the SKU, so this (like `stock`)
   * is left undefined, not just hidden, when rendered on the customer side. */
  sku?: string;
  brand: string;
  category: string;
  /** Already the price of the picked option, when the inquiry was about one. */
  price: number;
  /** The option the customer picked (e.g. Capacidad: 5 TB), if any. */
  variant?: { optionName: string; label: string };
  imageUrl: string;
  isFeatured: boolean;
  isOnSale: boolean;
  /** Admin-only — customers must never see stock, so this is left undefined
   * (not just hidden) when this card is rendered on the customer's side. */
  stock?: number;
}

/** Shown alongside a conversation so whoever's replying has the product's
 * context at a glance — image, name, brand, category, price and badges
 * (plus SKU and stock for the admin side). */
export function ProductMiniCard(product: ProductMiniCardProps) {
  return (
    <Link
      href={`/productos/${product.id}`}
      target="_blank"
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-soft transition-shadow hover:shadow-card-hover sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="flex min-w-0 flex-1 gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
          <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-1.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {product.isFeatured && (
              <Badge variant="highlight" className="gap-1 px-2 py-0 text-[10px]">
                <Star className="h-2.5 w-2.5 fill-current" />
                Destacado
              </Badge>
            )}
            {product.isOnSale && (
              <Badge variant="destructive" className="px-2 py-0 text-[10px]">
                Oferta
              </Badge>
            )}
            <Badge variant="outline" className="px-2 py-0 text-[10px]">
              {product.category}
            </Badge>
          </div>
          <h3 className="mt-1 truncate text-sm font-semibold text-foreground">
            Producto: {product.name}
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            Marca: {product.brand}
            {product.sku !== undefined && ` · SKU: ${product.sku}`}
          </p>
          {product.variant && (
            <p className="truncate text-xs font-medium text-foreground">
              {product.variant.optionName}: {product.variant.label}
            </p>
          )}
          {product.stock !== undefined && (
            <p
              className={cn(
                "mt-0.5 flex items-center gap-1 text-xs font-medium",
                product.stock === 0 ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {product.stock === 0 && <PackageX className="h-3 w-3" />}
              Stock: {product.stock}
            </p>
          )}
        </div>
      </div>
      <span className="self-end text-base font-bold text-foreground sm:shrink-0">
        {formatCurrency(product.price)}
      </span>
    </Link>
  );
}
