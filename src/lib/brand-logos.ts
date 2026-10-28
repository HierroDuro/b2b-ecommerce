/**
 * Brands that have a transparent PNG logo in /public/brands/<slug>.png (width x
 * height in px, so the strip can reserve space). Brands not listed here are
 * shown by name instead. Slugs come from brandSlug() in lib/brand-slug.ts.
 */
export const brandLogos: Record<string, { w: number; h: number }> = {
  noga: { w: 731, h: 160 },
  "tp-link": { w: 425, h: 160 },
  genius: { w: 349, h: 160 },
  logitech: { w: 525, h: 160 },
  jbl: { w: 289, h: 160 },
  hp: { w: 160, h: 160 },
  mercusys: { w: 1213, h: 160 },
  brother: { w: 433, h: 160 },
  epson: { w: 664, h: 160 },
  kingston: { w: 640, h: 160 },
  head: { w: 1030, h: 160 },
  sandisk: { w: 823, h: 160 },
  hiksemi: { w: 1066, h: 160 },
  seagate: { w: 658, h: 160 },
  hyperx: { w: 555, h: 160 },
  kelyx: { w: 738, h: 160 },
  biwo: { w: 406, h: 160 },
  stg: { w: 248, h: 160 },
  "alpine-skate": { w: 274, h: 160 },
  cld: { w: 287, h: 160 },
  gtc: { w: 332, h: 160 },
  goldery: { w: 649, h: 160 },
  trendy: { w: 830, h: 160 },
};
