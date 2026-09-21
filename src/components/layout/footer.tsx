import Link from "next/link";

import { SiteLogo } from "@/components/layout/site-logo";
import { siteConfig } from "@/config/site";

/**
 * Public footer. Intentionally contains no reference — visible or hidden
 * in markup — to the /admin panel, per the project's security requirement
 * that the admin panel have zero discoverable entry points.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-[1920px] gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:px-10">
        <div className="space-y-3">
          <SiteLogo className="h-16 sm:h-16 lg:h-[4.5rem]" />
          <p className="max-w-xs text-sm text-muted-foreground">{siteConfig.description}</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Navegación</h3>
          <ul className="space-y-2">
            {siteConfig.nav.map((item) => (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Categorías</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Tecnología</li>
            <li>Resmas</li>
            <li>Gráfica</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Contacto</h3>
          <a
            href={`mailto:${siteConfig.contact.email}`}
            className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {siteConfig.contact.email}
          </a>
          <a
            href={siteConfig.contact.phoneHref}
            className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Tel. {siteConfig.contact.phone}
          </a>
          <p className="text-sm text-muted-foreground">Lun a Vie, 9 a 18 h</p>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-[1920px] px-6 py-5 text-center text-xs text-muted-foreground lg:px-10">
          © {year} {siteConfig.name}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
