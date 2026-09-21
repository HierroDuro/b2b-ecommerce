/**
 * Central place for site-wide constants. Editing values here (instead of
 * scattering magic strings across components) keeps header/footer/SEO in
 * sync with a single source of truth.
 */
export const siteConfig = {
  name: "Fitotecno",
  shortName: "Fitotecno",
  description:
    "Librería comercial, artística, escolar e imprenta en el Microcentro. Más de 20 años ofreciendo insumos para la oficina y soluciones gráficas.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  nav: [
    { label: "Productos", href: "/" },
    { label: "Servicios", href: "/servicios" },
    { label: "Nosotros", href: "/nosotros" },
  ],
  contact: {
    email: "fitograf@fitograf.com",
    phone: "11 4331-2412",
    // CABA landline: 011 4331-2412 in international form.
    phoneHref: "tel:+541143312412",
  },
  branches: [
    { name: "Moreno 450", image: "/nosotros/sucursal-moreno-450.jpg" },
    { name: "Moreno 451", image: "/nosotros/sucursal-moreno-451.jpg" },
    { name: "Perú 299", image: "/nosotros/sucursal-peru-299.jpg" },
  ],
} as const;
