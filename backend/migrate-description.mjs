import prisma from './src/config/db.js'

await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "description" TEXT`)
await prisma.$executeRawUnsafe(`UPDATE "Product" SET "description" = COALESCE("fullDescription", "shortDescription", '') WHERE "description" IS NULL OR "description" = ''`)
await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ALTER COLUMN "description" SET NOT NULL`)
console.log('Migration complete: description column added and populated')
await prisma.$disconnect()
