import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Nosotros",
  description:
    "Somos FITOGRAF, una librería comercial, artística, escolar e imprenta ubicada en el Microcentro. Más de 20 años proveyendo soluciones con la más alta calidad.",
};

export default async function NosotrosPage() {
  const [productCount, categoryCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.category.count(),
  ]);

  const stats = [
    { label: "Años de trayectoria", value: "+20" },
    { label: "Sucursales", value: String(siteConfig.branches.length) },
    { label: "Productos", value: String(productCount) },
    { label: "Categorías", value: String(categoryCount) },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main
        className="mx-auto max-w-5xl px-6 pb-24 lg:px-10"
        style={{ paddingTop: "calc(var(--header-h) + 48px)" }}
      >
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            Quiénes somos
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Somos <span className="text-gradient-aurora">FITOGRAF</span>, una librería comercial,
            artística, escolar e imprenta ubicada en el Microcentro.
          </h1>
          <div className="mt-6 space-y-4 leading-relaxed text-muted-foreground">
            <p>
              Hace más de 20 años nos dedicamos a proveer al cliente todas las soluciones y con la
              más alta calidad.
            </p>
            <p>
              En FITOGRAF tenemos el más amplio stock de insumos para la oficina y nuestra Imprenta
              está en continua evolución para ofrecer soluciones gráficas con el mejor resultado del
              mercado.
            </p>
            <p>
              Entre nuestros clientes se encuentran Organizaciones, Empresas, Pymes, Emprendedores
              hasta Estudiantes que confían día a día en nuestra Calidad y Servicio.
            </p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-border bg-card px-5 py-4 text-center shadow-soft sm:text-left"
            >
              <p className="text-2xl font-bold text-gradient-aurora">{stat.value}</p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-14 flex items-center gap-2 text-xl font-semibold text-foreground">
          <MapPin className="h-5 w-5 text-primary" />
          Nuestras sucursales
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {siteConfig.branches.map((branch) => (
            <figure key={branch.name}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border shadow-soft">
                <Image
                  src={branch.image}
                  alt={`Sucursal ${branch.name}, C.A.B.A.`}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-3 text-center text-sm text-muted-foreground">
                Sucursal {branch.name}. C.A.B.A.
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center gap-4 rounded-2xl border border-border bg-card/60 px-8 py-10 text-center shadow-soft sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h3 className="text-lg font-semibold text-foreground">¿Buscás un proveedor de confianza?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Explorá el catálogo completo o llamanos al {siteConfig.contact.phone}.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-105"
          >
            Ver catálogo
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
