-- CreateEnum
CREATE TYPE "AttributeInputType" AS ENUM ('SELECT', 'MULTI_SELECT', 'RANGE', 'BOOLEAN', 'TEXT');

-- AlterTable: add level column to Category
ALTER TABLE "Category" ADD COLUMN "level" INTEGER NOT NULL DEFAULT 1;

-- Update existing L2 categories (those with a parentId) to level 2
UPDATE "Category" SET "level" = 2 WHERE "parentId" IS NOT NULL;

-- CreateTable: CategoryAttribute
CREATE TABLE "CategoryAttribute" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inputType" "AttributeInputType" NOT NULL DEFAULT 'SELECT',
    "options" TEXT[],
    "required" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CategoryAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ProductAttributeValue
CREATE TABLE "ProductAttributeValue" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "categoryAttributeId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ProductAttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Category_level_idx" ON "Category"("level");

CREATE INDEX "CategoryAttribute_categoryId_idx" ON "CategoryAttribute"("categoryId");

CREATE INDEX "ProductAttributeValue_productId_idx" ON "ProductAttributeValue"("productId");

CREATE UNIQUE INDEX "ProductAttributeValue_productId_categoryAttributeId_key" ON "ProductAttributeValue"("productId", "categoryAttributeId");

-- AddForeignKey
ALTER TABLE "CategoryAttribute" ADD CONSTRAINT "CategoryAttribute_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductAttributeValue" ADD CONSTRAINT "ProductAttributeValue_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductAttributeValue" ADD CONSTRAINT "ProductAttributeValue_categoryAttributeId_fkey" FOREIGN KEY ("categoryAttributeId") REFERENCES "CategoryAttribute"("id") ON DELETE CASCADE ON UPDATE CASCADE;
