import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { createTestBrand, createTestBuyer, cleanupTestUsers, getFirstCategoryName } from './helpers/db.js'

// ─── Shared state ─────────────────────────────────────────────────────────────

let approvedToken = ''
let pendingToken = ''
let buyerToken = ''
let verifiedBrandEmail = ''  // for duplicate-email test
let signupEmail = ''
const password = 'Brand1234!'
let createdProductId = ''
let PRODUCT_PAYLOAD = null  // built in beforeAll once we know a real category slug

beforeAll(async () => {
  await cleanupTestUsers()
  signupEmail = `test-brand-signup-${Date.now()}@sb-test.com`

  const approved = await createTestBrand({ approved: true })
  approvedToken = approved.token
  verifiedBrandEmail = approved.email

  const pending = await createTestBrand({ approved: false })
  pendingToken = pending.token

  const buyer = await createTestBuyer()
  buyerToken = buyer.token

  // Use a real category name from the DB so product creation doesn't fail validation
  const categoryName = await getFirstCategoryName()
  PRODUCT_PAYLOAD = {
    name: 'Handloom Silk Scarf',
    shortDescription: 'A beautiful handwoven silk scarf from Varanasi',
    wholesalePriceInr: 800,
    moq: 5,
    leadTime: 'ONE_TO_TWO_WEEKS',
    weightGrams: 150,
    categories: categoryName ? [categoryName] : [],
    enabledZones: ['DOMESTIC'],
  }
})

afterAll(() => cleanupTestUsers())

// ═══════════════════════════════════════════════════════════════
// AUTH — SIGNUP
// ═══════════════════════════════════════════════════════════════

describe('Brand — Signup', () => {
  it('missing brandName → 422', async () => {
    const res = await request(app).post('/api/auth/brand/signup')
      .send({ email: `x-${Date.now()}@sb-test.com`, password, category: ['Textiles'], countryOfOrigin: 'IN', gstNumber: 'GST123' })
    expect([400, 422]).toContain(res.status)
  })

  it('missing both gstNumber and businessRegNumber → 422', async () => {
    const res = await request(app).post('/api/auth/brand/signup')
      .send({ email: `x-${Date.now()}@sb-test.com`, password, brandName: 'X', category: ['Textiles'], countryOfOrigin: 'IN' })
    expect([400, 422]).toContain(res.status)
  })

  it('empty category array → 422', async () => {
    const res = await request(app).post('/api/auth/brand/signup')
      .send({ email: `x-${Date.now()}@sb-test.com`, password, brandName: 'X', category: [], countryOfOrigin: 'IN', gstNumber: 'GST123' })
    expect([400, 422]).toContain(res.status)
  })

  it('invalid countryOfOrigin (not 2 chars) → 422', async () => {
    const res = await request(app).post('/api/auth/brand/signup')
      .send({ email: `x-${Date.now()}@sb-test.com`, password, brandName: 'X', category: ['Textiles'], countryOfOrigin: 'IND', gstNumber: 'GST123' })
    expect([400, 422]).toContain(res.status)
  })

  it('success → 201 with BRAND role', async () => {
    const res = await request(app).post('/api/auth/brand/signup')
      .send({ email: signupEmail, password, brandName: 'Test Brand Co', category: ['Textiles'], countryOfOrigin: 'IN', gstNumber: 'GSTIN12345678901' })
    expect(res.status).toBe(201)
    expect(res.body.data.user.role).toBe('BRAND')
  })

  it('duplicate of verified email → 409', async () => {
    const res = await request(app).post('/api/auth/brand/signup')
      .send({ email: verifiedBrandEmail, password, brandName: 'Dupe', category: ['Textiles'], countryOfOrigin: 'IN', gstNumber: 'GSTIN99999999999' })
    expect(res.status).toBe(409)
  })

  it('login → 200 with accessToken', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: signupEmail, password })
    expect(res.status).toBe(200)
    expect(res.body.data.accessToken).toBeTruthy()
  })
})

// ═══════════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════════

describe('Brand — Profile: read', () => {
  it('unauthenticated → 401', async () => {
    const res = await request(app).get('/api/brands/me/profile')
    expect(res.status).toBe(401)
  })

  it('buyer token → 403', async () => {
    const res = await request(app).get('/api/brands/me/profile')
      .set('Authorization', `Bearer ${buyerToken}`)
    expect(res.status).toBe(403)
  })

  it('approved brand → 200 with APPROVED status', async () => {
    const res = await request(app).get('/api/brands/me/profile')
      .set('Authorization', `Bearer ${approvedToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('APPROVED')
    expect(res.body.data.brandName).toBe('Test Brand Co')
  })

  it('pending brand → 200 with PENDING status', async () => {
    const res = await request(app).get('/api/brands/me/profile')
      .set('Authorization', `Bearer ${pendingToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('PENDING')
  })
})

describe('Brand — Profile: update', () => {
  it('PATCH valid fields → 200, persisted', async () => {
    const res = await request(app).patch('/api/brands/me/profile')
      .set('Authorization', `Bearer ${approvedToken}`)
      .send({ description: 'Updated description', city: 'Jaipur', minimumOrderValue: 3000 })
    expect(res.status).toBe(200)
    expect(res.body.data.description).toBe('Updated description')
    expect(res.body.data.city).toBe('Jaipur')
  })

  it('PATCH with invalid websiteUrl → 422', async () => {
    const res = await request(app).patch('/api/brands/me/profile')
      .set('Authorization', `Bearer ${approvedToken}`)
      .send({ websiteUrl: 'not-a-url' })
    expect([400, 422]).toContain(res.status)
  })

  it('PATCH invalid payoutSpeed → 422', async () => {
    const res = await request(app).patch('/api/brands/me/profile')
      .set('Authorization', `Bearer ${approvedToken}`)
      .send({ payoutSpeed: 'INSTANT' })
    expect([400, 422]).toContain(res.status)
  })

  it('PATCH valid payoutSpeed NET_30 → 200', async () => {
    const res = await request(app).patch('/api/brands/me/profile')
      .set('Authorization', `Bearer ${approvedToken}`)
      .send({ payoutSpeed: 'NET_30' })
    expect(res.status).toBe(200)
  })

  it('PATCH with valid empty websiteUrl (allowed) → 200', async () => {
    const res = await request(app).patch('/api/brands/me/profile')
      .set('Authorization', `Bearer ${approvedToken}`)
      .send({ websiteUrl: '' })
    expect(res.status).toBe(200)
  })

  it('buyer token cannot PATCH brand profile → 403', async () => {
    const res = await request(app).patch('/api/brands/me/profile')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ description: 'nope' })
    expect(res.status).toBe(403)
  })
})

// ═══════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════

describe('Brand — Products: create', () => {
  it('pending brand cannot create product → 403', async () => {
    const res = await request(app).post('/api/products')
      .set('Authorization', `Bearer ${pendingToken}`)
      .send({ ...PRODUCT_PAYLOAD })
    expect(res.status).toBe(403)
  })

  it('buyer cannot create product → 403', async () => {
    const res = await request(app).post('/api/products')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ ...PRODUCT_PAYLOAD })
    expect(res.status).toBe(403)
  })

  it('unauthenticated cannot create product → 401', async () => {
    const res = await request(app).post('/api/products')
      .send({ ...PRODUCT_PAYLOAD })
    expect(res.status).toBe(401)
  })

  it('approved brand missing required field (shortDescription) → 422', async () => {
    const { shortDescription: _, ...partial } = PRODUCT_PAYLOAD
    const res = await request(app).post('/api/products')
      .set('Authorization', `Bearer ${approvedToken}`)
      .send(partial)
    expect([400, 422]).toContain(res.status)
  })

  it('approved brand missing enabledZones → 422', async () => {
    const { enabledZones: _, ...partial } = PRODUCT_PAYLOAD
    const res = await request(app).post('/api/products')
      .set('Authorization', `Bearer ${approvedToken}`)
      .send(partial)
    expect([400, 422]).toContain(res.status)
  })

  it('approved brand with invalid leadTime → 422', async () => {
    const res = await request(app).post('/api/products')
      .set('Authorization', `Bearer ${approvedToken}`)
      .send({ ...PRODUCT_PAYLOAD, leadTime: 'SAME_DAY' })
    expect([400, 422]).toContain(res.status)
  })

  it('approved brand with complete payload → 201', async () => {
    const res = await request(app).post('/api/products')
      .set('Authorization', `Bearer ${approvedToken}`)
      .send({ ...PRODUCT_PAYLOAD, name: `Test Product ${Date.now()}` })
    expect(res.status).toBe(201)
    expect(res.body.data.name).toBeDefined()
    createdProductId = res.body.data.id
  })
})

describe('Brand — Products: list', () => {
  it('GET /api/products/me/listings → 200, own products', async () => {
    const res = await request(app).get('/api/products/me/listings')
      .set('Authorization', `Bearer ${approvedToken}`)
    expect(res.status).toBe(200)
    const list = res.body.data.products ?? res.body.data
    expect(Array.isArray(list)).toBe(true)
    expect(list.length).toBeGreaterThan(0)
  })

  it('GET /api/products/me/listings — buyer → 403', async () => {
    const res = await request(app).get('/api/products/me/listings')
      .set('Authorization', `Bearer ${buyerToken}`)
    expect(res.status).toBe(403)
  })

  it('GET /api/products/me/listings — unauthenticated → 401', async () => {
    const res = await request(app).get('/api/products/me/listings')
    expect(res.status).toBe(401)
  })
})

describe('Brand — Products: update & delete', () => {
  it('PATCH own product → 200, field updated', async () => {
    if (!createdProductId) return
    const res = await request(app).patch(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${approvedToken}`)
      .send({ shortDescription: 'Updated in tests' })
    expect(res.status).toBe(200)
    expect(res.body.data.shortDescription).toBe('Updated in tests')
  })

  it('PATCH non-existent product → 404', async () => {
    const res = await request(app).patch('/api/products/nonexistent-product-id')
      .set('Authorization', `Bearer ${approvedToken}`)
      .send({ shortDescription: 'nope' })
    expect(res.status).toBe(404)
  })

  it('buyer cannot PATCH product → 403', async () => {
    if (!createdProductId) return
    const res = await request(app).patch(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ shortDescription: 'nope' })
    expect(res.status).toBe(403)
  })

  it('DELETE own product → 200', async () => {
    if (!createdProductId) return
    const res = await request(app).delete(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${approvedToken}`)
    expect(res.status).toBe(200)
  })

  it('DELETE already-deleted product → 404', async () => {
    if (!createdProductId) return
    const res = await request(app).delete(`/api/products/${createdProductId}`)
      .set('Authorization', `Bearer ${approvedToken}`)
    expect(res.status).toBe(404)
  })
})

// ═══════════════════════════════════════════════════════════════
// ORDERS (brand side)
// ═══════════════════════════════════════════════════════════════

describe('Brand — Orders', () => {
  it('GET /api/orders/brand → 200, orders array', async () => {
    const res = await request(app).get('/api/orders/brand')
      .set('Authorization', `Bearer ${approvedToken}`)
    expect(res.status).toBe(200)
    const list = res.body.data.orders ?? res.body.data
    expect(Array.isArray(list)).toBe(true)
  })

  it('GET /api/orders/brand?status=CONFIRMED → 200', async () => {
    const res = await request(app).get('/api/orders/brand?status=CONFIRMED')
      .set('Authorization', `Bearer ${approvedToken}`)
    expect(res.status).toBe(200)
  })

  it('GET /api/orders/brand — buyer token → 403', async () => {
    const res = await request(app).get('/api/orders/brand')
      .set('Authorization', `Bearer ${buyerToken}`)
    expect(res.status).toBe(403)
  })

  it('GET /api/orders/brand — unauthenticated → 401', async () => {
    const res = await request(app).get('/api/orders/brand')
    expect(res.status).toBe(401)
  })

  it('PATCH /api/orders/brand/:id/status with invalid status → 422', async () => {
    const res = await request(app).patch('/api/orders/brand/any-order/status')
      .set('Authorization', `Bearer ${approvedToken}`)
      .send({ status: 'INVALID_STATUS' })
    expect([400, 422]).toContain(res.status)
  })

  it('PATCH /api/orders/brand/:id/status on non-existent order → 404', async () => {
    const res = await request(app).patch('/api/orders/brand/nonexistent-order-id/status')
      .set('Authorization', `Bearer ${approvedToken}`)
      .send({ status: 'CONFIRMED' })
    expect(res.status).toBe(404)
  })

  it('PATCH /api/orders/brand/:id/status — buyer cannot update order status → 403', async () => {
    const res = await request(app).patch('/api/orders/brand/any-order/status')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ status: 'CONFIRMED' })
    expect(res.status).toBe(403)
  })
})

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════

describe('Brand — Dashboard', () => {
  it('GET /api/brands/me/dashboard → 200', async () => {
    const res = await request(app).get('/api/brands/me/dashboard')
      .set('Authorization', `Bearer ${approvedToken}`)
    expect(res.status).toBe(200)
  })

  it('pending brand can view dashboard → 200', async () => {
    const res = await request(app).get('/api/brands/me/dashboard')
      .set('Authorization', `Bearer ${pendingToken}`)
    expect(res.status).toBe(200)
  })

  it('unauthenticated → 401', async () => {
    const res = await request(app).get('/api/brands/me/dashboard')
    expect(res.status).toBe(401)
  })

  it('buyer token → 403', async () => {
    const res = await request(app).get('/api/brands/me/dashboard')
      .set('Authorization', `Bearer ${buyerToken}`)
    expect(res.status).toBe(403)
  })
})

// ═══════════════════════════════════════════════════════════════
// PUBLIC BRAND ROUTES
// ═══════════════════════════════════════════════════════════════

describe('Brand — Public catalogue', () => {
  it('GET /api/brands → 200, array of approved brands', async () => {
    const res = await request(app).get('/api/brands')
    expect(res.status).toBe(200)
  })

  it('GET /api/brands/:slug with bad slug → 404', async () => {
    const res = await request(app).get('/api/brands/slug-that-does-not-exist-xyz')
    expect(res.status).toBe(404)
  })
})
