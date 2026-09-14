"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Boxes, Tag, Truck, MessageCircle, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import type { ProductDTO } from "@/types/product";

interface HeroProps {
  productCount: number;
  categoryCount: number;
  showcaseProducts: ProductDTO[];
}

const valueProps: { icon: LucideIcon; label: string }[] = [
  { icon: Boxes, label: "Catálogo amplio" },
  { icon: Tag, label: "Precios mayoristas" },
  { icon: Truck, label: "Envíos a todo el país" },
  { icon: MessageCircle, label: "Atención directa" },
];

/**
 * Homepage hero: a two-column, conversion-first fold. Left side answers
 * "what do we sell, and why should I buy here" in one glance (headline,
 * value props, CTA); right side shows real catalog products — not a stock
 * photo — as proof that there's an actual, priced product range behind
 * the pitch. Kept deliberately calm (no decorative blobs, one restrained
 * brand gradient) per the corporate-B2B direction.
 */
export function Hero({ productCount, categoryCount, showcaseProducts }: HeroProps) {
  const showcase = showcaseProducts.slice(0, 3);

  return (
    <section className="grid gap-10 py-8 lg:grid-cols-2 lg:items-start lg:gap-16 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          Proveedor B2B · Stock actualizado
        </span>

        <h1 className="mt-5 text-4xl font-bold leading-[1.12] tracking-tight text-foreground sm:text-5xl">
          Todo lo que tu empresa necesita,{" "}
          <span className="text-gradient-aurora">en un solo proveedor</span>.
        </h1>

        <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
          Vendemos productos de tecnología, papelería y artículos gráficos para el día a día
          de tu empresa, con catálogo actualizado y precios preferenciales por volumen.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="#catalogo"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.03]"
          >
            Ver catálogo
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/servicios"
            className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            Conocé nuestros servicios
          </Link>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
          {valueProps.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
            </div>
          ))}
        </dl>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="relative mx-auto w-full max-w-md"
      >
        <div className="relative aspect-[4/4.4] w-full overflow-hidden rounded-3xl bg-secondary/70">
          {/* Faint dot-grid texture — the only decorative touch, confined to
              this one panel instead of washing over the whole page. */}
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage: "radial-gradient(hsl(var(--primary) / 0.25) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />

          {showcase[0] && (
            <ShowcaseCard
              product={showcase[0]}
              className="absolute left-6 top-8 w-44 -rotate-3 sm:left-8 sm:w-48"
            />
          )}
          {showcase[1] && (
            <ShowcaseCard
              product={showcase[1]}
              className="absolute right-4 top-24 w-40 rotate-6 sm:right-6 sm:top-28 sm:w-44"
            />
          )}
          {showcase[2] && (
            <ShowcaseCard
              product={showcase[2]}
              className="absolute bottom-8 left-1/2 w-44 -translate-x-1/2 rotate-2 sm:w-48"
            />
          )}

          <div className="absolute right-4 top-4 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-soft">
            +{productCount} productos
          </div>
          <div className="absolute bottom-4 left-4 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground shadow-soft">
            {categoryCount} categorías
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function ShowcaseCard({ product, className }: { product: ProductDTO; className: string }) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-border bg-card p-3 shadow-card transition-transform hover:rotate-0 hover:scale-105 ${className}`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white">
        <Image src={product.imageUrl} alt={product.name} fill sizes="200px" className="object-contain p-3" />
      </div>
      <p className="mt-2 line-clamp-1 text-xs font-semibold text-foreground">{product.name}</p>
      <p className="text-sm font-bold text-primary">{formatCurrency(product.price)}</p>
    </div>
  );
}

/** Auto-scrolling horizontal strip of on-sale products — pure CSS
 * animation (no JS timer), the item list is rendered twice back-to-back
 * and the track scrolls exactly half its width, so the loop is seamless.
 * Hover pauses it (CSS-only) so it's actually readable/clickable. Rendered
 * as its own section below the hero fold, not inside it, so the main
 * pitch (headline + CTA) isn't competing with a busy scrolling strip. */
export function OffersMarquee({ offers }: { offers: ProductDTO[] }) {
  if (offers.length === 0) return null;

  const track = [...offers, ...offers];
  const durationSeconds = Math.max(offers.length * 5, 20);

  return (
    <div className="mb-10">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Tag className="h-4 w-4 text-primary" />
        Ofertas de la semana
      </h2>
      <div className="group w-full max-w-none overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
        <div
          className="flex w-max items-stretch gap-5 [animation-play-state:running] group-hover:[animation-play-state:paused]"
          style={{
            // Longhand properties on purpose: the `animation` shorthand
            // implicitly resets animation-play-state to "running" and, set
            // inline, would out-specificity the group-hover class above —
            // leaving play-state out of this inline style is what lets the
            // hover-to-pause utility actually take effect.
            animationName: "marquee",
            animationDuration: `${durationSeconds}s`,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        >
          {track.map((product, i) => (
            <Link
              key={`${product.id}-${i}`}
              href={`/productos/${product.id}`}
              className="relative flex w-56 shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-left shadow-soft transition-shadow hover:border-primary/30 hover:shadow-card-hover sm:w-64"
            >
              <Badge
                variant="destructive"
                className="absolute left-2.5 top-2.5 z-10 gap-1 px-2 py-0.5 text-[10px]"
              >
                <Tag className="h-3 w-3" />
                Oferta
              </Badge>
              <div className="relative aspect-square w-full bg-white">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="256px"
                  className="object-contain p-6"
                />
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3.5">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                  {product.name}
                </p>
                <div className="mt-auto flex items-baseline gap-2 pt-1">
                  {product.originalPrice && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                  <span className="font-bold text-foreground">{formatCurrency(product.price)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
