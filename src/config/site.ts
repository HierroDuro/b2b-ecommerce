/**
 * Central place for site-wide constants. Editing values here (instead of
 * scattering magic strings across components) keeps header/footer/SEO in
 * sync with a single source of truth.
 */
export const siteConfig = {
  name: "Fitotecno",
  shortName: "Fitotecno",
  description:
    "Plataforma B2B de tecnología, resmas y artículos gráficos. Catálogo actualizado, precios preferenciales y stock en tiempo real para empresas.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  nav: [
    { label: "Productos", href: "/" },
    { label: "Servicios", href: "/servicios" },
    { label: "Nosotros", href: "/nosotros" },
  ],
} as const;
