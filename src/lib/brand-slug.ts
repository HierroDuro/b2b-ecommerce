/**
 * URL-safe slug of a brand name ("TP-Link" -> "tp-link", "Alpine Skate" ->
 * "alpine-skate", "Genérico" -> "generico"). Pure (no DB access) so client
 * components can build brand links too. Brands are free text, so two
 * spellings that differ only in case/accents/spaces share a slug — the same
 * rule `brandKey` uses in `lib/brands.ts`.
 */
export function brandSlug(brand: string): string {
  return brand
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
