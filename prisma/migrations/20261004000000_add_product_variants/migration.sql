-- AlterTable
ALTER TABLE "products" ADD COLUMN     "optionName" TEXT NOT NULL DEFAULT 'Color';

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "price" DECIMAL(65,30),
    "imageUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
