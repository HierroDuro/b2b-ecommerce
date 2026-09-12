import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag, Truck, Headset, MessageCircle, type LucideIcon } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Servicios",
  description: "Servicios de venta mayorista, logística y soporte para empresas.",
};

const services: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: ShoppingBag,
    title: "Venta mayorista",
    desc: "Precios diferenciales por volumen de compra, pensados para el consumo real de tu empresa.",
  },
  {
    icon: Truck,
    title: "Logística propia",
    desc: "Entregas coordinadas a todo el país, con seguimiento del pedido de punta a punta.",
  },
  {
    icon: Headset,
    title: "Soporte técnico",
    desc: "Asesoramiento antes y después de la compra, para elegir bien y resolver cualquier duda.",
  },
];

export default function ServiciosPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main
        className="mx-auto max-w-5xl px-6 pb-24 lg:px-10"
        style={{ paddingTop: siteConfig.headerHeight + 48 }}
      >
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            Cómo trabajamos
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Servicios pensados para <span className="text-gradient-aurora">tu empresa</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Ofrecemos venta mayorista con precios preferenciales, logística propia y soporte
            técnico dedicado para empresas de todos los tamaños.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {services.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group rounded-xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_40px_-16px_hsl(var(--primary)/0.35)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[hsl(var(--aurora-2))] text-primary-foreground transition-transform group-hover:scale-110">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/60 px-8 py-10 text-center shadow-soft sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="text-lg font-semibold text-foreground">¿Tenés dudas sobre algún producto?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Consultanos por chat directamente desde la ficha de cada producto.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-[hsl(var(--aurora-2))] px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-105"
          >
            <MessageCircle className="h-4 w-4" />
            Ver catálogo
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
