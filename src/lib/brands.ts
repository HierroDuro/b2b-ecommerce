import { prisma } from "@/lib/prisma";

/**
 * Brands are free text on each product (there is no Brand table), so "Noga",
 * "noga" and "NOGA" would otherwise show up as three different brands in the
 * storefront filters. Everything here compares brands by a normalized key —
 * trimmed, accents stripped, lowercased, inner spaces collapsed — and always
 * resolves to the spelling that's already in use.
 */

export function brandKey(brand: string): string {
  return brand
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Collapses repeated inner spaces and trims ("  Noga   Net " -> "Noga Net"). */
export function cleanBrand(brand: string): string {
  return brand.replace(/\s+/g, " ").trim();
}

/** Picks, among spellings of the same brand, the most used one; on a tie the
 * one that starts with an uppercase letter wins, then plain alphabetical. */
function pickCanonical(spellings: { name: string; count: number }[]): string {
  return [...spellings].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    const aUpper = a.name[0] === a.name[0]?.toUpperCase() && a.name[0] !== a.name[0]?.toLowerCase();
    const bUpper = b.name[0] === b.name[0]?.toUpperCase() && b.name[0] !== b.name[0]?.toLowerCase();
    if (aUpper !== bUpper) return aUpper ? -1 : 1;
    return a.name.localeCompare(b.name, "es");
  })[0]!.name;
}

/** Every brand in use (active or not), one entry per normalized key, with the
 * canonical spelling and the total number of products, A-Z. */
export async function getExistingBrands(
  excludeProductId?: string,
): Promise<{ name: string; count: number }[]> {
  const rows = await prisma.product.groupBy({
    by: ["brand"],
    where: excludeProductId ? { id: { not: excludeProductId } } : undefined,
    _count: { _all: true },
  });
  const byKey = new Map<string, { name: string; count: number }[]>();
  for (const r of rows) {
    const key = brandKey(r.brand);
    if (!key) continue;
    const list = byKey.get(key) ?? [];
    list.push({ name: r.brand, count: r._count._all });
    byKey.set(key, list);
  }
  return [...byKey.values()]
    .map((spellings) => ({
      name: pickCanonical(spellings),
      count: spellings.reduce((sum, s) => sum + s.count, 0),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
}

/** The brand to actually store: the existing spelling if this brand is
 * already in use (ignoring case/accents/extra spaces), otherwise the typed
 * value, cleaned up. When editing, pass the product's own id so its current
 * spelling doesn't count — otherwise fixing "noga" to "Noga" on the only
 * product that has it would be "corrected" straight back to "noga". */
export async function resolveBrand(input: string, excludeProductId?: string): Promise<string> {
  const cleaned = cleanBrand(input);
  const key = brandKey(cleaned);
  if (!key) return cleaned;
  const existing = await getExistingBrands(excludeProductId);
  return existing.find((b) => brandKey(b.name) === key)?.name ?? cleaned;
}
