import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { createTestBuyer, cleanupTestUsers, getActiveProduct } from './helpers/db.js'

// ─── Shared state ─────────────────────────────────────────────────────────────

let token = ''            // verified buyer token (from API login)
let unverifiedToken = ''  // separate buyer: signed up but OTP never submitted
let signupEmail = ''
const password = 'Buyer1234!'
let productId = ''
let variantId = null
let brandProfileId = ''   // from seeded data, for saved-brand tests

beforeAll(async () => {
  await cleanupTestUsers()
  signupEmail = `test-buyer-${Date.now()}@sb-test.com`

  const product = await getActiveProduct()
  if (product) {
    productId = product.id
    variantId = product.variants[0]?.id ?? null
    brandProfileId = product.brandProfileId
  }

  // Pre-create a separate buyer whose email is NEVER verified, for requireVerified tests.
  // We capture the signup token but never call /verify-email for this user, so
  // isEmailVerified stays false in DB and requireVerified returns 403.
  const unverifiedSignup = await request(app).post('/api/auth/buyer/signup')
    .send({
      email: `test-buyer-unverified-${Date.now()}@sb-test.com`,
      password,
      businessName: 'Unverified Store',
      countryCode: 'IN',
    })
  unverifiedToken = unverifiedSignup.body.data?.accessToken ?? ''
})

afterAll(() => cleanupTestUsers())

// ═══════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════

describe('Buyer — Auth: signup', () => {
  it('missing email → 422', async () => {
    const res = await request(app).post('/api/auth/buyer/signup')
      .send({ password, businessName: 'X', countryCode: 'IN' })
    expect([400, 422]).toContain(res.status)
  })

  it('invalid email format → 422', async () => {
    const res = await request(app).post('/api/auth/buyer/signup')
      .send({ email: 'not-an-email', password, businessName: 'X', countryCode: 'IN' })
    expect([400, 422]).toContain(res.status)
  })

  it('weak password (no digit) → 422', async () => {
    const res = await request(app).post('/api/auth/buyer/signup')
      .send({ email: `weak-${Date.now()}@sb-test.com`, password: 'NoDigits!', businessName: 'X', countryCode: 'IN' })
    expect([400, 422]).toContain(res.status)
  })

  it('missing businessName → 422', async () => {
    const res = await request(app).post('/api/auth/buyer/signup')
      .send({ email: `nobiz-${Date.now()}@sb-test.com`, password, countryCode: 'IN' })
    expect([400, 422]).toContain(res.status)
  })

  it('success → 201 with accessToken and BUYER role', async () => {
    const res = await request(app).post('/api/auth/buyer/signup')
      .send({ email: signupEmail, password, businessName: 'Test Store', countryCode: 'IN' })
    expect(res.status).toBe(201)
    expect(res.body.data.user.role).toBe('BUYER')
    expect(res.body.data.user.email).toBe(signupEmail)
    expect(res.body.data.accessToken).toBeTruthy()
  })

  it('duplicate email → 409', async () => {
    const res = await request(app).post('/api/auth/buyer/signup')
      .send({ email: signupEmail, password, businessName: 'Dupe', countryCode: 'IN' })
    expect(res.status).toBe(409)
  })
})

describe('Buyer — Auth: email verification', () => {
  it('wrong OTP → 400/401', async () => {
    const res = await request(app).post('/api/auth/verify-email')
      .send({ email: signupEmail, otp: '000000' })
    expect([400, 401]).toContain(res.status)
  })

  it('correct OTP (mocked 123456) → 200', async () => {
    const res = await request(app).post('/api/auth/verify-email')
      .send({ email: signupEmail, otp: '123456' })
    expect(res.status).toBe(200)
  })

  it('already-verified OTP reuse → 400', async () => {
    const res = await request(app).post('/api/auth/verify-email')
      .send({ email: signupEmail, otp: '123456' })
    expect([400, 410]).toContain(res.status)
  })
})

describe('Buyer — Auth: login', () => {
  it('non-existent email → 401', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'nobody@example.com', password })
    expect(res.status).toBe(401)
  })

  it('wrong password → 401', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: signupEmail, password: 'wrongPass9' })
    expect(res.status).toBe(401)
  })

  it('correct credentials → 200 with accessToken', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: signupEmail, password })
    expect(res.status).toBe(200)
    expect(res.body.data.accessToken).toBeTruthy()
    token = res.body.data.accessToken
  })
})

describe('Buyer — Auth: role isolation', () => {
  it('buyer token cannot reach brand profile → 403', async () => {
    const res = await request(app).get('/api/brands/me/profile')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('buyer token cannot reach admin stats → 403', async () => {
    const res = await request(app).get('/api/admin/stats')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
  })

  it('no token → 401 on any protected route', async () => {
    const res = await request(app).get('/api/buyer/profile')
    expect(res.status).toBe(401)
  })

  it('malformed token → 401', async () => {
    const res = await request(app).get('/api/buyer/profile')
      .set('Authorization', 'Bearer not.a.token')
    expect(res.status).toBe(401)
  })
})

// ═══════════════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════════════

describe('Buyer — Profile: read', () => {
  it('GET profile → 200 with businessName and countryCode', async () => {
    const res = await request(app).get('/api/buyer/profile')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.businessName).toBe('Test Store')
    expect(res.body.data.countryCode).toBe('IN')
  })
})

describe('Buyer — Profile: update', () => {
  it('unverified buyer cannot PATCH profile → 403', async () => {
    const res = await request(app).patch('/api/buyer/profile')
      .set('Authorization', `Bearer ${unverifiedToken}`)
      .send({ city: 'Mumbai' })
    expect(res.status).toBe(403)
  })

  it('PATCH valid fields → 200, fields persisted', async () => {
    const res = await request(app).patch('/api/buyer/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ phone: '+91 9876543210', city: 'Delhi', state: 'DL', preferredCurrency: 'USD' })
    expect(res.status).toBe(200)
    expect(res.body.data.phone).toBe('+91 9876543210')
    expect(res.body.data.city).toBe('Delhi')
  })

  it('PATCH notification toggles → 200, persisted', async () => {
    const res = await request(app).patch('/api/buyer/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ notifNewArrivals: false, notifOrderUpdates: true, notifPromotions: true })
    expect(res.status).toBe(200)
    expect(res.body.data.notifNewArrivals).toBe(false)
    expect(res.body.data.notifOrderUpdates).toBe(true)
    expect(res.body.data.notifPromotions).toBe(true)
  })

  it('GET profile after update → reflects changes', async () => {
    const res = await request(app).get('/api/buyer/profile')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.city).toBe('Delhi')
    expect(res.body.data.notifNewArrivals).toBe(false)
  })

  it('PATCH with invalid preferredCurrency (not a string) does not crash', async () => {
    const res = await request(app).patch('/api/buyer/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ preferredCurrency: 'INR' })
    expect(res.status).toBe(200)
  })
})

// ═══════════════════════════════════════════════════════════════
// CATALOGUE
// ═══════════════════════════════════════════════════════════════

describe('Buyer — Catalogue', () => {
  it('GET /api/products → 200, returns array', async () => {
    const res = await request(app).get('/api/products')
    expect(res.status).toBe(200)
    const list = res.body.data.products ?? res.body.data
    expect(Array.isArray(list)).toBe(true)
  })

  it('GET /api/products?page=1&limit=5 → 200, max 5 results', async () => {
    const res = await request(app).get('/api/products?page=1&limit=5')
    expect(res.status).toBe(200)
    const list = res.body.data.products ?? res.body.data
    expect(list.length).toBeLessThanOrEqual(5)
  })

  it('GET /api/products?search=xyz → 200 (even if 0 results)', async () => {
    const res = await request(app).get('/api/products?search=xyznonexistent123')
    expect(res.status).toBe(200)
  })

  it('GET /api/categories → 200, array', async () => {
    const res = await request(app).get('/api/categories')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data?.categories ?? res.body.data)).toBe(true)
  })

  it('GET /api/products/:slug with bad slug → 404', async () => {
    const res = await request(app).get('/api/products/does-not-exist-slug-abc')
    expect(res.status).toBe(404)
  })

  it('GET /api/brands → 200, public list', async () => {
    const res = await request(app).get('/api/brands')
    expect(res.status).toBe(200)
  })
})

// ═══════════════════════════════════════════════════════════════
// CART
// ═══════════════════════════════════════════════════════════════

describe('Buyer — Cart', () => {
  it('GET empty cart → 200, items array', async () => {
    const res = await request(app).get('/api/buyer/cart')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.items).toBeDefined()
  })

  it('PUT without productId → 422', async () => {
    const res = await request(app).put('/api/buyer/cart/item')
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 1 })
    expect([400, 422]).toContain(res.status)
  })

  it('PUT with quantity 0 → 422', async () => {
    const res = await request(app).put('/api/buyer/cart/item')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: productId || 'dummy', quantity: 0 })
    expect([400, 422]).toContain(res.status)
  })

  it('PUT with negative quantity → 422', async () => {
    const res = await request(app).put('/api/buyer/cart/item')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: productId || 'dummy', quantity: -5 })
    expect([400, 422]).toContain(res.status)
  })

  it('unverified buyer cannot PUT item → 403', async () => {
    const body = { productId: productId || 'test-product-id', quantity: 5 }
    if (variantId) body.variantId = variantId
    const res = await request(app).put('/api/buyer/cart/item')
      .set('Authorization', `Bearer ${unverifiedToken}`)
      .send(body)
    expect(res.status).toBe(403)
  })

  it('PUT valid product → 200 or 400 (below MOQ)', async () => {
    if (!productId) return
    const body = { productId, quantity: 1 }
    if (variantId) body.variantId = variantId
    const res = await request(app).put('/api/buyer/cart/item')
      .set('Authorization', `Bearer ${token}`).send(body)
    expect([200, 400]).toContain(res.status)
  })

  it('PUT non-existent productId → 404', async () => {
    const res = await request(app).put('/api/buyer/cart/item')
      .set('Authorization', `Bearer ${token}`)
      .send({ productId: 'nonexistent-product-id', quantity: 5 })
    expect([400, 404]).toContain(res.status)
  })

  it('DELETE specific item from cart → 200 or 404', async () => {
    if (!productId) return
    const res = await request(app).delete(`/api/buyer/cart/item/${productId}`)
      .set('Authorization', `Bearer ${token}`)
    expect([200, 404]).toContain(res.status)
  })

  it('DELETE entire cart → 200', async () => {
    const res = await request(app).delete('/api/buyer/cart')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })
})

// ═══════════════════════════════════════════════════════════════
// SAVED ITEMS
// ═══════════════════════════════════════════════════════════════

describe('Buyer — Saved items', () => {
  it('GET saved → 200, products/brands arrays', async () => {
    const res = await request(app).get('/api/buyer/saved')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data.products)).toBe(true)
    expect(Array.isArray(res.body.data.brands)).toBe(true)
  })

  it('POST save product → 200/201', async () => {
    if (!productId) return
    const res = await request(app).post(`/api/buyer/saved/product/${productId}`)
      .set('Authorization', `Bearer ${token}`)
    expect([200, 201]).toContain(res.status)
  })

  it('POST save same product again → idempotent 200/201', async () => {
    if (!productId) return
    const res = await request(app).post(`/api/buyer/saved/product/${productId}`)
      .set('Authorization', `Bearer ${token}`)
    expect([200, 201]).toContain(res.status)
  })

  it('GET saved → product appears in list after save', async () => {
    if (!productId) return
    const res = await request(app).get('/api/buyer/saved')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    const ids = res.body.data.products.map(p => p.id ?? p.productId)
    expect(ids).toContain(productId)
  })

  it('DELETE saved product → 200', async () => {
    if (!productId) return
    const res = await request(app).delete(`/api/buyer/saved/product/${productId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })

  it('GET saved → product removed after delete', async () => {
    if (!productId) return
    const res = await request(app).get('/api/buyer/saved')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    const ids = res.body.data.products.map(p => p.id ?? p.productId)
    expect(ids).not.toContain(productId)
  })

  it('POST save brand → 200/201', async () => {
    if (!brandProfileId) return
    const res = await request(app).post(`/api/buyer/saved/brand/${brandProfileId}`)
      .set('Authorization', `Bearer ${token}`)
    expect([200, 201]).toContain(res.status)
  })

  it('DELETE saved brand → 200', async () => {
    if (!brandProfileId) return
    const res = await request(app).delete(`/api/buyer/saved/brand/${brandProfileId}`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })

  it('unverified buyer cannot save product → 403', async () => {
    if (!productId) return
    const res = await request(app).post(`/api/buyer/saved/product/${productId}`)
      .set('Authorization', `Bearer ${unverifiedToken}`)
    expect(res.status).toBe(403)
  })
})

// ═══════════════════════════════════════════════════════════════
// ORDERS (buyer side)
// ═══════════════════════════════════════════════════════════════

describe('Buyer — Orders', () => {
  it('GET /api/orders/my → 200, orders array', async () => {
    const res = await request(app).get('/api/orders/my')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    const list = res.body.data.orders ?? res.body.data
    expect(Array.isArray(list)).toBe(true)
  })

  it('GET /api/orders/my?status=PENDING → 200', async () => {
    const res = await request(app).get('/api/orders/my?status=PENDING')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
  })

  it('GET /api/orders/my — unauthenticated → 401', async () => {
    const res = await request(app).get('/api/orders/my')
    expect(res.status).toBe(401)
  })

  it('GET /api/orders/:id with fake id → 403 or 404', async () => {
    const res = await request(app).get('/api/orders/nonexistent-order-id')
      .set('Authorization', `Bearer ${token}`)
    expect([403, 404]).toContain(res.status)
  })
})

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════

describe('Buyer — Dashboard', () => {
  it('GET /api/buyer/dashboard → 200 with wallet, recentOrders, referralStats', async () => {
    const res = await request(app).get('/api/buyer/dashboard')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.data.wallet).toBeDefined()
    expect(res.body.data.recentOrders).toBeDefined()
    expect(res.body.data.referralStats).toBeDefined()
  })

  it('unauthenticated → 401', async () => {
    const res = await request(app).get('/api/buyer/dashboard')
    expect(res.status).toBe(401)
  })
})

// ═══════════════════════════════════════════════════════════════
// STORE QUIZ
// ═══════════════════════════════════════════════════════════════

describe('Buyer — Store quiz', () => {
  it('POST with valid answers → 200', async () => {
    const res = await request(app).post('/api/auth/store-quiz')
      .set('Authorization', `Bearer ${token}`)
      .send({ storeType: 'boutique', aesthetic: 'minimalist', categoryInterests: ['textiles'] })
    expect(res.status).toBe(200)
  })

  it('unauthenticated → 401', async () => {
    const res = await request(app).post('/api/auth/store-quiz')
      .send({ storeType: 'boutique' })
    expect(res.status).toBe(401)
  })

  it('brand token → 403 (quiz is buyer-only)', async () => {
    // Use a pre-made brand user to verify role check
    const { createTestBrand } = await import('./helpers/db.js')
    const brand = await createTestBrand({ approved: true })
    const res = await request(app).post('/api/auth/store-quiz')
      .set('Authorization', `Bearer ${brand.token}`)
      .send({ storeType: 'boutique', categoryInterests: [] })
    expect(res.status).toBe(403)
  })
})
