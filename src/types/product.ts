import type { Category, Product } from "@prisma/client";

/** One selectable option of a product (e.g. the same cable in "Rosa"). A null
 * price/imageUrl means "same as the product". */
export interface ProductVariantDTO {
  id: string;
  label: string;
  price: number | null;
  imageUrl: string | null;
}

/** Product shape as returned to the client: Decimal fields become plain numbers. */
export interface ProductDTO
  extends Omit<Product, "price" | "originalPrice" | "createdAt" | "updatedAt"> {
  price: number;
  /** List price before the discount — only meaningful when `isOnSale` is true. */
  originalPrice: number | null;
  createdAt: string;
  updatedAt: string;
  category: Pick<Category, "id" | "name" | "slug">;
  /** Additional gallery image URLs (besides the cover `imageUrl`), in display order. */
  images: string[];
  /** Selectable variants (colors, capacities...). Absent/empty = no selector. */
  variants?: ProductVariantDTO[];
}

export interface CategoryDTO extends Category {
  productCount?: number;
}

export interface ProductListResponse {
  products: ProductDTO[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  availableBrands: string[];
  priceRange: { min: number; max: number };
}

/** One block of the curated homepage feed — a run of products from a
 * single category, already sorted (oferta > destacado > el resto). */
export interface CuratedSection {
  categorySlug: string;
  categoryName: string;
  products: ProductDTO[];
}

export interface CuratedFeedResponse {
  sections: CuratedSection[];
}

export interface OutOfStockProduct {
  id: string;
  name: string;
  sku: string;
  imageUrl: string;
  isActive: boolean;
}

export interface AdminStats {
  totalProducts: number;
  activeProducts: number;
  inactiveProducts: number;
  featuredProducts: number;
  outOfStock: number;
  onSale: number;
  totalCategories: number;
  inventoryValue: number;
  outOfStockProducts: OutOfStockProduct[];
}
