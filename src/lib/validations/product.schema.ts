import { z } from "zod";

/**
 * Shared validation for creating/editing a product from the admin panel.
 * Used both on the client (React Hook Form resolver) and on the server
 * (Server Actions / API routes) so invalid data can never reach Prisma —
 * this is also a first line of defense against XSS payloads stored in
 * free-text fields like `description`.
 */
export const productObjectSchema = z.object({
  // Free-form on purpose: any letters, digits, spaces, dots, slashes, etc.
  // The SKU is only ever displayed and searched, never used in a URL or
  // file path, so there is nothing to sanitize it for. Required + unique.
  sku: z.string().trim().min(1, "El SKU es obligatorio"),
  name: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(160, "El nombre es demasiado largo"),
  // Required, but no length limit in either direction beyond "not empty".
  description: z.string().trim().min(1, "La descripción es obligatoria"),
  brand: z.string().trim().min(1, "La marca es obligatoria").max(80),
  price: z.coerce.number().min(0, "El precio no puede ser negativo"),
  isOnSale: z.boolean().default(false),
  // Solo relevante con isOnSale activo — controla el banner corredizo de
  // la home, no la sección "Ofertas" del feed curado (esa siempre muestra
  // todos los productos en oferta).
  showInBanner: z.boolean().default(true),
  // Precio de lista (antes del descuento) — opcional, solo tiene sentido
  // con isOnSale activo. Un input vacío se normaliza a `null` (no a
  // `undefined`) para que updateProduct pueda *borrar* un precio original
  // ya cargado — Prisma ignora `undefined` en un update pero sí aplica
  // `null` para limpiar la columna.
  originalPrice: z.preprocess(
    (value) => {
      if (value === null || value === undefined) return null;
      if (typeof value === "string" && value.trim() === "") return null;
      return typeof value === "string" ? Number(value) : value;
    },
    z.number().positive("El precio original debe ser mayor a 0").nullable(),
  ),
  stock: z.coerce.number().int().min(0, "El stock no puede ser negativo"),
  imageUrl: z.string().min(1, "La imagen es obligatoria"),
  images: z.array(z.string().min(1)).max(8, "Máximo 8 imágenes de galería").optional().default([]),
  categoryId: z.string().min(1, "La categoría es obligatoria"),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

// `.refine()` wraps the object in a ZodEffects, which loses `.partial()` —
// exported separately so the PATCH route (partial updates) can still do
// `productObjectSchema.partial()` while everything else uses the full,
// refined `productSchema`.
export const productSchema = productObjectSchema.refine(
  (data) => !data.originalPrice || data.originalPrice > data.price,
  { message: "El precio original debe ser mayor al precio actual", path: ["originalPrice"] },
);

export type ProductInput = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(80),
});

export type CategoryInput = z.infer<typeof categorySchema>;

/** Query params accepted by the public product listing endpoint. */
export const productQuerySchema = z.object({
  search: z.string().trim().max(160).optional().default(""),
  categorySlugs: z.array(z.string()).optional().default([]),
  onSale: z.coerce.boolean().optional().default(false),
  featuredOnly: z.coerce.boolean().optional().default(false),
  brands: z.array(z.string()).optional().default([]),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  sort: z.enum(["relevance", "price-asc", "price-desc", "newest"]).optional().default("relevance"),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(60).optional().default(20),
});

export type ProductQueryInput = z.infer<typeof productQuerySchema>;
