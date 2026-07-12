-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "moq" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "VariantPriceTier" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "moq" INTEGER NOT NULL,
    "priceInr" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "VariantPriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VariantPriceTier_variantId_idx" ON "VariantPriceTier"("variantId");

-- AddForeignKey
ALTER TABLE "VariantPriceTier" ADD CONSTRAINT "VariantPriceTier_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
