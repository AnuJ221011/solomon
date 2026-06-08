import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminHash = await bcrypt.hash('Admin@12345', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@solomonbharat.com' },
    update: {},
    create: {
      email: 'admin@solomonbharat.com',
      passwordHash: adminHash,
      name: 'Platform Admin',
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });
  console.log(`Admin created: ${admin.email}`);

  // Create a sample approved brand
  const brandHash = await bcrypt.hash('Brand@12345', 12);
  const brandUser = await prisma.user.upsert({
    where: { email: 'artisans@example.com' },
    update: {},
    create: {
      email: 'artisans@example.com',
      passwordHash: brandHash,
      name: 'Artisan Collective',
      role: 'BRAND',
      isEmailVerified: true,
      brandProfile: {
        create: {
          brandName: 'Artisan Collective',
          slug: 'artisan-collective',
          category: ['Textiles', 'Home Decor'],
          countryOfOrigin: 'IN',
          gstNumber: '22AAAAA0000A1Z5',
          status: 'APPROVED',
          achievementLevel: 'L1_SPROUT',
          approvedAt: new Date(),
        },
      },
    },
  });
  console.log(`Brand created: ${brandUser.email}`);

  // Create a sample buyer
  const buyerHash = await bcrypt.hash('Buyer@12345', 12);
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@example.com' },
    update: {},
    create: {
      email: 'buyer@example.com',
      passwordHash: buyerHash,
      name: 'Jane Smith',
      role: 'BUYER',
      isEmailVerified: true,
      buyerProfile: {
        create: {
          businessName: 'Little Boutique NYC',
          countryCode: 'US',
          preferredCurrency: 'USD',
        },
      },
      wallet: { create: {} },
    },
  });
  console.log(`Buyer created: ${buyer.email}`);

  // ── Seed categories ────────────────────────────────────────────
  const CATEGORIES = [
    { name: 'Textiles',         slug: 'textiles',         description: 'Silk, cotton, handloom fabrics and woven goods',             sortOrder: 1 },
    { name: 'Home Decor',       slug: 'home-decor',       description: 'Pottery, brass, wood and home furnishing accents',            sortOrder: 2 },
    { name: 'Jewellery',        slug: 'jewellery',        description: 'Silver, gold, gemstone and artisan jewellery',                sortOrder: 3 },
    { name: 'Accessories',      slug: 'accessories',      description: 'Bags, scarves, wallets and fashion accessories',              sortOrder: 4 },
    { name: 'Apparel',          slug: 'apparel',          description: 'Kurtas, dupattas, sarees and readymade garments',             sortOrder: 5 },
    { name: 'Stationery',       slug: 'stationery',       description: 'Handmade journals, greeting cards and paper goods',           sortOrder: 6 },
    { name: 'Art & Craft',      slug: 'art-craft',        description: 'Paintings, prints, folk art and handcrafted gifts',           sortOrder: 7 },
    { name: 'Food & Wellness',  slug: 'food-wellness',    description: 'Artisan spices, teas, herbal remedies and wellness products', sortOrder: 8 },
  ];

  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
      create: cat,
    });
  }
  console.log(`${CATEGORIES.length} categories seeded.`);

  console.log('Seeding complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
