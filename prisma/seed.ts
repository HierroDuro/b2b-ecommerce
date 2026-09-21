/**
 * Database seed script.
 *
 * Run with: npm run db:seed (also runs automatically after `prisma migrate dev`
 * the first time, and can be re-run any time via `npx prisma db seed`).
 *
 * - Categories + ~40 products are upserted (safe to re-run).
 * - The initial admin user ("Fito" by default) is created with a bcrypt
 *   hash of ADMIN_PASSWORD from your .env file — the plaintext password
 *   is never written to the database or to source code. If ADMIN_PASSWORD
 *   is missing, the script fails loudly instead of silently skipping it.
 */
import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";
import { categories, products } from "./seed-data.mjs";

const BCRYPT_ROUNDS = 12;

async function main() {
  console.log("Seeding database...\n");

  // ── Categories ──────────────────────────────────────────────
  const categoryIdBySlug = new Map<string, string>();
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: { name: category.name, slug: category.slug },
    });
    categoryIdBySlug.set(category.slug, created.id);
  }
  console.log(`✔ ${categories.length} categorías listas`);

  // ── Products ────────────────────────────────────────────────
  let productCount = 0;
  for (const product of products) {
    const categoryId = categoryIdBySlug.get(product.categorySlug);
    if (!categoryId) {
      throw new Error(`Categoría desconocida para el producto ${product.sku}: ${product.categorySlug}`);
    }

    const galleryImages = product.galleryImages ?? [];

    const saved = await prisma.product.upsert({
      where: { sku: product.sku },
      update: {
        name: product.name,
        description: product.description,
        brand: product.brand,
        price: product.price,
        stock: product.stock,
        imageUrl: `/placeholders/${product.sku}.png`,
        isFeatured: product.isFeatured,
        isOnSale: product.isOnSale,
        categoryId,
      },
      create: {
        sku: product.sku,
        name: product.name,
        description: product.description,
        brand: product.brand,
        price: product.price,
        stock: product.stock,
        imageUrl: `/placeholders/${product.sku}.png`,
        isFeatured: product.isFeatured,
        isOnSale: product.isOnSale,
        categoryId,
        isActive: true,
      },
    });

    // Re-seedable: drop and recreate the gallery so re-running the seed
    // doesn't pile up duplicate images on every run.
    await prisma.productImage.deleteMany({ where: { productId: saved.id } });
    if (galleryImages.length > 0) {
      await prisma.productImage.createMany({
        data: galleryImages.map((url, order) => ({ url, order, productId: saved.id })),
      });
    }

    productCount += 1;
  }
  console.log(`✔ ${productCount} productos listos`);

  // ── Site configuration (singleton row) ─────────────────────
  const existingConfig = await prisma.siteConfig.findFirst();
  if (!existingConfig) {
    await prisma.siteConfig.create({
      data: { siteName: "Fitotecno", currency: "ARS" },
    });
    console.log("✔ Configuración del sitio creada");
  }

  // ── Admin user ──────────────────────────────────────────────
  const adminUsername = process.env.ADMIN_USERNAME?.trim() || "Fito";
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error(
      "\n✗ Falta ADMIN_PASSWORD en tu archivo .env.\n" +
        "  Definí una contraseña para el usuario administrador antes de seedear, por ejemplo:\n" +
        "  ADMIN_PASSWORD=\"una-contraseña-segura\"\n" +
        "  Nunca se guarda en texto plano: este script la hashea con bcrypt antes de insertarla.",
    );
  }

  if (adminPassword.length < 8) {
    throw new Error("✗ ADMIN_PASSWORD debe tener al menos 8 caracteres.");
  }

  const passwordHash = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);

  await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: { passwordHash },
    create: {
      username: adminUsername,
      passwordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });
  console.log(`✔ Usuario administrador "${adminUsername}" listo (contraseña hasheada con bcrypt)`);

  console.log("\nSeed completado con éxito.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
