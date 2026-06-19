-- Migration: replace shortDescription + fullDescription with a single description column
-- Safe to run multiple times: column existence is checked before each step.

-- Step 1: Add the new description column (if it doesn't already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Product' AND column_name = 'description'
  ) THEN
    ALTER TABLE "Product" ADD COLUMN "description" TEXT;
  END IF;
END
$$;

-- Step 2: Populate description from shortDescription (fall back to fullDescription)
UPDATE "Product"
SET "description" = COALESCE(NULLIF(TRIM("shortDescription"), ''), "fullDescription")
WHERE "description" IS NULL
  AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Product' AND column_name = 'shortDescription'
  );

-- Step 3: Drop shortDescription (if it still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Product' AND column_name = 'shortDescription'
  ) THEN
    ALTER TABLE "Product" DROP COLUMN "shortDescription";
  END IF;
END
$$;

-- Step 4: Drop fullDescription (if it still exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Product' AND column_name = 'fullDescription'
  ) THEN
    ALTER TABLE "Product" DROP COLUMN "fullDescription";
  END IF;
END
$$;
