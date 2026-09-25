import type { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/config/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
    // Same visibility rule as the public catalog: only an inactive product
    // has no indexable page — out-of-stock ones still get one ("No
    // disponible" badge, Consultar stays open).
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, updatedAt: true },
    }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteConfig.url, changeFrequency: "daily", priority: 1 },
    // /servicios oculto momentáneamente.
    { url: `${siteConfig.url}/nosotros`, changeFrequency: "monthly", priority: 0.5 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${siteConfig.url}/?categoria=${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${siteConfig.url}/productos/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
