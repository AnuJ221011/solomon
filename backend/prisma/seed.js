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

  console.log('Seeding complete.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
