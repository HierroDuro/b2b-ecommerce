import { prisma } from "@/lib/prisma";
import type { BrandOptionDTO } from "@/types/product";

/** Brands for the storefront ("Marcas" filter and brands strip): only brands
 * of active products, A-Z, with the generic "Genérico" bucket always last so
 * real brands read first. */
export async function getStorefrontBrands(): Promise<BrandOptionDTO[]> {
  const rows = await prisma.product.groupBy({
    by: ["brand"],
    where: { isActive: true },
    _count: { _all: true },
  });
  const isGeneric = (name: string) => name.trim().toLowerCase() === "genérico" || name.trim().toLowerCase() === "generico";
  return rows
    .map((r) => ({ name: r.brand, count: r._count._all }))
    .sort((a, b) => {
      if (isGeneric(a.name) !== isGeneric(b.name)) return isGeneric(a.name) ? 1 : -1;
      return a.name.localeCompare(b.name, "es", { sensitivity: "base" });
    });
}
