-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "lengthCm" DOUBLE PRECISION,
ADD COLUMN     "breadthCm" DOUBLE PRECISION,
ADD COLUMN     "heightCm" DOUBLE PRECISION;

-- Drop the free-text dimensions column (superseded by lengthCm/breadthCm/heightCm)
ALTER TABLE "public"."Product" DROP COLUMN "dimensions";
