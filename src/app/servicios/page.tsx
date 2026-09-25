import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Venta y copiado de libros contables, certificación de escribanía y fotocopias protocolares en el Microcentro.",
};

const services = [
  {
    title: "Venta y copiado de libros contables",
    desc: "Trámite urgente y normal",
    image: "/servicios/libros-contables.jpg",
  },
  {
    title: "Certificación escribanía",
    desc: "Fotocopias legalizadas",
    image: "/servicios/certificacion-escribania.jpg",
  },
  {
    title: "Fotocopias Protocolares",
    desc: "Hacemos todos los anchos y la mejor resolución",
    image: "/servicios/fotocopias-protocolares.jpg",
  },
];

// Página oculta momentáneamente: para volver a mostrarla, borrar esta constante
// y el `notFound()` de abajo, y reactivar el link en src/config/site.ts, el
// botón en components/layout/hero.tsx y la entrada en app/sitemap.ts.
const HIDDEN = true;

export default function ServiciosPage() {
  if (HIDDEN) notFound();
  return (
    <div className="min-h-screen">
      <Header />
      <main
        className="mx-auto max-w-5xl px-6 pb-24 lg:px-10"
        style={{ paddingTop: "calc(var(--header-h) + 48px)" }}
      >
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            Servicios
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Copiado, rúbrica y <span className="text-gradient-aurora">certificaciones</span>
          </h1>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {services.map(({ title, desc, image }) => (
            <article
              key={title}
              className="flex min-h-40 overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-shadow hover:border-primary/30 hover:shadow-card-hover sm:min-h-44"
            >
              <div className="relative w-32 shrink-0 bg-white sm:w-44">
                <Image src={image} alt={title} fill sizes="176px" className="object-cover" />
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
                <h2 className="font-semibold leading-snug text-foreground">{title}</h2>
                <span aria-hidden className="mt-3 h-0.5 w-12 rounded-full bg-primary" />
                <p className="mt-3 text-sm text-muted-foreground">{desc}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/60 px-8 py-10 text-center shadow-soft sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="text-lg font-semibold text-foreground">¿Necesitás un servicio o un presupuesto?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Llamanos al {siteConfig.contact.phone} o escribinos a {siteConfig.contact.email}.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-center gap-3">
            <a
              href={siteConfig.contact.phoneHref}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-105"
            >
              <Phone className="h-4 w-4" />
              Llamar
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <MessageCircle className="h-4 w-4" />
              Ver catálogo
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
