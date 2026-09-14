import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, PackageSearch, Truck, RefreshCw, type LucideIcon } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Nosotros",
  description: `Conocé a ${siteConfig.name}, tu proveedor B2B de confianza.`,
};

const values: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: ShieldCheck,
    title: "Precios competitivos",
    desc: "Buenos precios en todo el catálogo, sin condiciones ni letra chica.",
  },
  {
    icon: RefreshCw,
    title: "Stock en tiempo real",
    desc: "El catálogo refleja lo que realmente hay disponible, sin sorpresas al momento de comprar.",
  },
  {
    icon: Truck,
    title: "Logística propia",
    desc: "Coordinamos la entrega a todo el país con seguimiento de punta a punta.",
  },
  {
    icon: PackageSearch,
    title: "Catálogo variado",
    desc: "Tecnología, resmas y artículos gráficos en un solo lugar, sin multiplicar proveedores.",
  },
];

export default async function NosotrosPage() {
  const [productCount, categoryCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count(),
  ]);

  return (
    <div className="min-h-screen">
      <Header />
      <main
        className="mx-auto max-w-5xl px-6 pb-24 lg:px-10"
        style={{ paddingTop: siteConfig.headerHeight + 48 }}
      >
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            Quiénes somos
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Conectamos tu empresa con lo que <span className="text-gradient-aurora">necesita</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            En {siteConfig.name} conectamos empresas con el mejor catálogo de tecnología, resmas y
            artículos gráficos, con stock actualizado y atención personalizada.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { label: "Productos", value: productCount },
            { label: "Categorías", value: categoryCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card px-5 py-4 text-center shadow-soft sm:text-left"
            >
              <p className="text-2xl font-bold text-gradient-aurora">{stat.value}</p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">{stat.label}</p>
            </div>
          ))}
          <div className="rounded-xl border border-border bg-card px-5 py-4 text-center shadow-soft sm:text-left">
            <p className="text-2xl font-bold text-gradient-aurora">Lun a Vie</p>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">Atención 9 a 18 h</p>
          </div>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2">
          {values.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group flex gap-4 rounded-xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_40px_-16px_hsl(var(--primary)/0.35)]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[hsl(var(--aurora-2))] text-primary-foreground transition-transform group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-foreground">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/60 px-8 py-10 text-center shadow-soft sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="text-lg font-semibold text-foreground">¿Buscás un proveedor de confianza?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Explorá el catálogo completo y consultanos lo que necesites.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[hsl(var(--aurora-2))] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-105"
          >
            Ver catálogo
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
