"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Boxes, Tag, Truck, MessageCircle, type LucideIcon } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import type { ProductDTO } from "@/types/product";

interface HeroProps {
  productCount: number;
  showcaseProducts: ProductDTO[];
}

const valueProps: { icon: LucideIcon; label: string }[] = [
  { icon: Boxes, label: "Catálogo amplio" },
  { icon: Tag, label: "Precios competitivos" },
  { icon: Truck, label: "Envíos" },
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
export function Hero({ productCount, showcaseProducts }: HeroProps) {
  const showcase = showcaseProducts.slice(0, 3);

  return (
    <section className="grid gap-6 py-5 sm:py-8 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-14">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          Librería e imprenta · Microcentro, CABA
        </span>

        <h1 className="mt-4 text-3xl font-bold leading-[1.15] tracking-tight text-foreground sm:mt-5 sm:text-4xl sm:leading-[1.12] lg:text-5xl">
          Todo lo que tu empresa necesita,{" "}
          <span className="text-gradient-aurora">en un solo proveedor</span>.
        </h1>

        <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-8">
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

        <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 sm:mt-10 sm:flex sm:flex-wrap sm:items-center sm:gap-x-8 sm:gap-y-3">
          {valueProps.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0 text-primary" />
              <span className="whitespace-nowrap text-xs font-medium text-muted-foreground">{label}</span>
            </div>
          ))}
        </dl>

        {/* Phone/tablet get the same "cheapest 3, real and clickable"
            proof as the desktop panel, just as a plain 3-up row instead
            of a floating collage — that layout only works with the extra
            width of the two-column desktop grid. */}
        <div className="mt-6 lg:hidden">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {showcase.map((product) => (
              <Link
                key={product.id}
                href={`/productos/${product.id}`}
                className="overflow-hidden rounded-lg border border-border bg-card p-2 shadow-soft transition-transform active:scale-95 sm:p-3"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-md bg-white">
                  <Image
                    src={product.imageUrl}
                    alt={product.name}
                    fill
                    sizes="140px"
                    className="object-contain p-2"
                  />
                </div>
                <p className="mt-1.5 line-clamp-1 text-[11px] font-medium text-foreground sm:text-xs">
                  {product.name}
                </p>
                <p className="text-xs font-bold text-primary sm:text-sm">
                  {formatCurrency(product.price)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </motion.div>

      {/* The floating product-collage panel needs the extra width of the
          two-column desktop grid to breathe — phone and tablet get the
          plain 3-up row above instead (rendered inline with the text). */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="relative mx-auto hidden w-full max-w-md lg:block"
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
        </div>
      </motion.div>
    </section>
  );
}

function ShowcaseCard({ product, className }: { product: ProductDTO; className: string }) {
  return (
    <Link
      href={`/productos/${product.id}`}
      className={`block overflow-hidden rounded-xl border border-border bg-card p-3 shadow-card transition-transform hover:z-10 hover:rotate-0 hover:scale-105 ${className}`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-white">
        <Image src={product.imageUrl} alt={product.name} fill sizes="200px" className="object-contain p-3" />
      </div>
      <p className="mt-2 line-clamp-1 text-xs font-semibold text-foreground">{product.name}</p>
      <p className="text-sm font-bold text-primary">{formatCurrency(product.price)}</p>
    </Link>
  );
}
