-- AlterTable
ALTER TABLE "Product"
ADD COLUMN "artisanName" TEXT,
ADD COLUMN "dimensions" TEXT,
ADD COLUMN "howItIsMade" TEXT,
ADD COLUMN "isGITagged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "isHandmade" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "material" TEXT,
ADD COLUMN "placeOfOrigin" TEXT;

-- AlterTable
ALTER TABLE "ProductPhoto" ADD COLUMN "mediaType" TEXT NOT NULL DEFAULT 'image';

-- CreateTable
CREATE TABLE "ProductPriceTier" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "moq" INTEGER NOT NULL,
    "priceInr" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ProductPriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductPriceTier_productId_idx" ON "ProductPriceTier"("productId");

-- AddForeignKey
ALTER TABLE "ProductPriceTier" ADD CONSTRAINT "ProductPriceTier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
