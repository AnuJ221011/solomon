import bcrypt from 'bcryptjs'
import prisma from '../../src/config/db.js'
import { generateAccessToken } from '../../src/shared/utils/token.js'

const TEST_EMAIL_SUFFIX = '@sb-test.com'

// ─── Create test users directly (no API, no OTP) ─────────────────────────────

export async function createTestAdmin() {
  const email = `test-admin-${Date.now()}${TEST_EMAIL_SUFFIX}`
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash('Admin1234!', 10),
      name: 'Test Admin',
      role: 'ADMIN',
      isEmailVerified: true,
    },
  })
  return { user, token: generateAccessToken(user.id, 'ADMIN') }
}

export async function createTestBuyer() {
  const email = `test-buyer-${Date.now()}${TEST_EMAIL_SUFFIX}`
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash('Buyer1234!', 10),
      name: 'Test Buyer',
      role: 'BUYER',
      isEmailVerified: true,
      buyerProfile: { create: { businessName: 'Test Store', countryCode: 'IN' } },
      wallet: { create: {} },
      cart: { create: {} },
    },
  })
  return { user, token: generateAccessToken(user.id, 'BUYER') }
}

export async function createTestBrand({ approved = false } = {}) {
  const ts = Date.now()
  const email = `test-brand-${ts}${TEST_EMAIL_SUFFIX}`
  const slug = `test-brand-${ts}`
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash('Brand1234!', 10),
      name: 'Test Brand',
      role: 'BRAND',
      isEmailVerified: true,
      brandProfile: {
        create: {
          brandName: 'Test Brand Co',
          slug,
          category: ['Textiles'],
          countryOfOrigin: 'IN',
          status: approved ? 'APPROVED' : 'PENDING',
          ...(approved ? { approvedAt: new Date() } : {}),
        },
      },
    },
    include: { brandProfile: true },
  })
  return { user, email, token: generateAccessToken(user.id, 'BRAND'), brandProfile: user.brandProfile }
}

// ─── Get an existing L1 category slug for product creation ───────────────────

export async function getFirstCategoryName() {
  const cat = await prisma.category.findFirst({ where: { level: 1, isActive: true } })
  return cat?.name ?? null
}

// ─── Get first active product for cart/order tests ───────────────────────────

export async function getActiveProduct() {
  return prisma.product.findFirst({
    where: { availability: 'ACTIVE' },
    include: {
      variants: { where: { status: 'ACTIVE', stock: { gt: 0 } }, take: 1 },
    },
  })
}

// ─── Cleanup all test data ────────────────────────────────────────────────────

export async function cleanupTestUsers() {
  await prisma.user.deleteMany({ where: { email: { endsWith: TEST_EMAIL_SUFFIX } } })
}
