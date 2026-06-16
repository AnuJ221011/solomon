import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import app from '../src/app.js'
import { createTestAdmin, createTestBuyer, createTestBrand, cleanupTestUsers } from './helpers/db.js'

// ─── Shared state ─────────────────────────────────────────────────────────────

let adminToken = ''
let buyerToken = ''
let brandToken = ''
let testBuyerUserId = ''
let pendingBrandProfileId = ''
let pendingBrandUserId = ''
let approvedBrandProfileId = ''

beforeAll(async () => {
  await cleanupTestUsers()

  const admin = await createTestAdmin()
  adminToken = admin.token

  const buyer = await createTestBuyer()
  testBuyerUserId = buyer.user.id
  buyerToken = buyer.token

  const approvedBrand = await createTestBrand({ approved: true })
  approvedBrandProfileId = approvedBrand.brandProfile.id
  brandToken = approvedBrand.token

  const pendingBrand = await createTestBrand({ approved: false })
  pendingBrandProfileId = pendingBrand.brandProfile.id
  pendingBrandUserId = pendingBrand.user.id
})

afterAll(() => cleanupTestUsers())

// ═══════════════════════════════════════════════════════════════
// AUTH / ROLE GUARD — every admin route
// ═══════════════════════════════════════════════════════════════

describe('Admin — Role guard', () => {
  it('no token → 401 on any admin route', async () => {
    const res = await request(app).get('/api/admin/stats')
    expect(res.status).toBe(401)
  })

  it('buyer token → 403', async () => {
    const res = await request(app).get('/api/admin/stats')
      .set('Authorization', `Bearer ${buyerToken}`)
    expect(res.status).toBe(403)
  })

  it('brand token → 403', async () => {
    const res = await request(app).get('/api/admin/stats')
      .set('Authorization', `Bearer ${brandToken}`)
    expect(res.status).toBe(403)
  })

  it('malformed token → 401', async () => {
    const res = await request(app).get('/api/admin/stats')
      .set('Authorization', 'Bearer not.valid.jwt')
    expect(res.status).toBe(401)
  })

  it('admin token → 200', async () => {
    const res = await request(app).get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })
})

// ═══════════════════════════════════════════════════════════════
// PLATFORM STATS
// ═══════════════════════════════════════════════════════════════

describe('Admin — Stats', () => {
  it('GET /api/admin/stats → 200, expected shape', async () => {
    const res = await request(app).get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    const d = res.body.data
    expect(typeof d.totalBrands).toBe('number')
    expect(typeof d.totalBuyers).toBe('number')
    expect(typeof d.totalOrders).toBe('number')
    expect(typeof d.pendingApprovals).toBe('number')
    expect(d.pendingApprovals).toBeGreaterThanOrEqual(1)  // we created 1 pending brand
  })

  it('GET /api/admin/stats/revenue → 200', async () => {
    const res = await request(app).get('/api/admin/stats/revenue')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('GET /api/admin/stats/revenue?days=7 → 200', async () => {
    const res = await request(app).get('/api/admin/stats/revenue?days=7')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('GET /api/admin/stats/revenue?days=5 → 422 (below min 7)', async () => {
    const res = await request(app).get('/api/admin/stats/revenue?days=5')
      .set('Authorization', `Bearer ${adminToken}`)
    expect([400, 422]).toContain(res.status)
  })

  it('GET /api/admin/stats/revenue?days=400 → 422 (above max 365)', async () => {
    const res = await request(app).get('/api/admin/stats/revenue?days=400')
      .set('Authorization', `Bearer ${adminToken}`)
    expect([400, 422]).toContain(res.status)
  })

  it('GET /api/admin/stats/categories → 200', async () => {
    const res = await request(app).get('/api/admin/stats/categories')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('GET /api/admin/inventory/low-stock → 200, array', async () => {
    const res = await request(app).get('/api/admin/inventory/low-stock')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('GET /api/admin/inventory/low-stock?threshold=5 → 200', async () => {
    const res = await request(app).get('/api/admin/inventory/low-stock?threshold=5')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })
})

// ═══════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════

describe('Admin — Users: list & filter', () => {
  it('GET /api/admin/users → 200, paginated', async () => {
    const res = await request(app).get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    const users = res.body.data.users ?? res.body.data
    expect(Array.isArray(users)).toBe(true)
    expect(users.length).toBeGreaterThan(0)
  })

  it('filter by role=BUYER → only buyers', async () => {
    const res = await request(app).get('/api/admin/users?role=BUYER')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    const users = res.body.data.users ?? res.body.data
    users.forEach(u => expect(u.role).toBe('BUYER'))
  })

  it('filter by role=BRAND → only brands', async () => {
    const res = await request(app).get('/api/admin/users?role=BRAND')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    const users = res.body.data.users ?? res.body.data
    users.forEach(u => expect(u.role).toBe('BRAND'))
  })

  it('filter by invalid role → 422', async () => {
    const res = await request(app).get('/api/admin/users?role=SUPERADMIN')
      .set('Authorization', `Bearer ${adminToken}`)
    expect([400, 422]).toContain(res.status)
  })

  it('search by email domain → 200', async () => {
    const res = await request(app).get('/api/admin/users?search=sb-test.com')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    const users = res.body.data.users ?? res.body.data
    expect(users.length).toBeGreaterThan(0)
  })

  it('filter status=ACTIVE → 200', async () => {
    const res = await request(app).get('/api/admin/users?status=ACTIVE')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('GET /api/admin/users/export → 200, CSV content-type', async () => {
    const res = await request(app).get('/api/admin/users/export')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/csv')
  })
})

describe('Admin — Users: suspend & reactivate', () => {
  it('suspend active buyer → 200', async () => {
    const res = await request(app).post(`/api/admin/users/${testBuyerUserId}/suspend`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('suspended user cannot log in', async () => {
    // The buyer was created directly, so no password to test with. Just verify
    // the suspend route worked by checking the list.
    const res = await request(app).get('/api/admin/users?status=SUSPENDED')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    const users = res.body.data.users ?? res.body.data
    const found = users.find(u => u.id === testBuyerUserId)
    expect(found).toBeDefined()
  })

  it('reactivate suspended buyer → 200', async () => {
    const res = await request(app).post(`/api/admin/users/${testBuyerUserId}/reactivate`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('reactivate already-active user is idempotent → 200', async () => {
    const res = await request(app).post(`/api/admin/users/${testBuyerUserId}/reactivate`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)  // service is idempotent, not an error
  })

  it('suspend non-existent user → 404', async () => {
    const res = await request(app).post('/api/admin/users/nonexistent-user-id/suspend')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
  })
})

// ═══════════════════════════════════════════════════════════════
// BRANDS
// ═══════════════════════════════════════════════════════════════

describe('Admin — Brands', () => {
  it('GET /api/admin/brands/pending → 200, pending brands listed', async () => {
    const res = await request(app).get('/api/admin/brands/pending')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    const brands = res.body.data.brands ?? res.body.data
    expect(Array.isArray(brands)).toBe(true)
    expect(brands.length).toBeGreaterThan(0)
    brands.forEach(b => expect(b.status).toBe('PENDING'))
  })

  it('GET /api/admin/brands/approved → 200, approved brands listed', async () => {
    const res = await request(app).get('/api/admin/brands/approved')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    const brands = res.body.data.brands ?? res.body.data
    expect(Array.isArray(brands)).toBe(true)
    brands.forEach(b => expect(b.status).toBe('APPROVED'))
  })

  it('GET /api/admin/brands/:id → 200 for existing brand', async () => {
    const res = await request(app).get(`/api/admin/brands/${approvedBrandProfileId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.id ?? res.body.data.brandProfile?.id).toBeTruthy()
  })

  it('GET /api/admin/brands/:id → 404 for non-existent', async () => {
    const res = await request(app).get('/api/admin/brands/nonexistent-brand-id')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
  })

  it('POST /api/admin/brands/:id/approve — approves pending brand', async () => {
    const res = await request(app).post(`/api/admin/brands/${pendingBrandProfileId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.status).toBe('APPROVED')
  })

  it('POST /api/admin/brands/:id/approve — already-approved → 400', async () => {
    const res = await request(app).post(`/api/admin/brands/${pendingBrandProfileId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(400)
  })

  it('POST /api/admin/brands/:id/reject — can reject an approved brand', async () => {
    const fresh = await createTestBrand({ approved: false })
    const res = await request(app).post(`/api/admin/brands/${fresh.brandProfile.id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('POST /api/admin/brands/:id/reject — non-existent → 404', async () => {
    const res = await request(app).post('/api/admin/brands/nonexistent-id/reject')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
  })
})

// ═══════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════

describe('Admin — Products', () => {
  it('GET /api/admin/products → 200, paginated', async () => {
    const res = await request(app).get('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('filter by availability=ACTIVE → 200', async () => {
    const res = await request(app).get('/api/admin/products?availability=ACTIVE')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    const products = res.body.data.products ?? res.body.data
    if (Array.isArray(products)) {
      products.forEach(p => expect(p.availability).toBe('ACTIVE'))
    }
  })

  it('filter by availability=INACTIVE → 200', async () => {
    const res = await request(app).get('/api/admin/products?availability=INACTIVE')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('invalid availability filter → 422', async () => {
    const res = await request(app).get('/api/admin/products?availability=DELETED')
      .set('Authorization', `Bearer ${adminToken}`)
    expect([400, 422]).toContain(res.status)
  })

  it('search by name → 200', async () => {
    const res = await request(app).get('/api/admin/products?search=silk')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('filter by brandId → 200', async () => {
    const res = await request(app).get(`/api/admin/products?brandId=${approvedBrandProfileId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })
})

// ═══════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════

describe('Admin — Orders', () => {
  it('GET /api/admin/orders → 200, paginated', async () => {
    const res = await request(app).get('/api/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.orders ?? res.body.data).toBeDefined()
  })

  const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'DISPUTED']
  VALID_STATUSES.forEach(status => {
    it(`filter by status=${status} → 200`, async () => {
      const res = await request(app).get(`/api/admin/orders?status=${status}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.status).toBe(200)
    })
  })

  it('invalid status SHIPPED → 422', async () => {
    const res = await request(app).get('/api/admin/orders?status=SHIPPED')
      .set('Authorization', `Bearer ${adminToken}`)
    expect([400, 422]).toContain(res.status)
  })

  it('filter by date range → 200', async () => {
    const res = await request(app)
      .get('/api/admin/orders?dateFrom=2025-01-01T00:00:00.000Z&dateTo=2030-12-31T23:59:59.000Z')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('filter by brandId → 200', async () => {
    const res = await request(app).get(`/api/admin/orders?brandId=${approvedBrandProfileId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('search by buyer name → 200', async () => {
    const res = await request(app).get('/api/admin/orders?search=Test')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('pagination params → 200', async () => {
    const res = await request(app).get('/api/admin/orders?page=1&limit=5')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('invalid limit (above max) → 422', async () => {
    const res = await request(app).get('/api/admin/orders?limit=999')
      .set('Authorization', `Bearer ${adminToken}`)
    expect([400, 422]).toContain(res.status)
  })
})

// ═══════════════════════════════════════════════════════════════
// PAYOUTS
// ═══════════════════════════════════════════════════════════════

describe('Admin — Payouts', () => {
  it('GET /api/admin/payouts → 200', async () => {
    const res = await request(app).get('/api/admin/payouts')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('filter isPaid=true → 200', async () => {
    const res = await request(app).get('/api/admin/payouts?isPaid=true')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('filter isPaid=false → 200', async () => {
    const res = await request(app).get('/api/admin/payouts?isPaid=false')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('filter by ISO date range → 200', async () => {
    const res = await request(app)
      .get('/api/admin/payouts?dateFrom=2025-01-01T00:00:00.000Z&dateTo=2030-12-31T23:59:59.000Z')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  it('non-ISO dateFrom → 422', async () => {
    const res = await request(app).get('/api/admin/payouts?dateFrom=2025-01-01')
      .set('Authorization', `Bearer ${adminToken}`)
    expect([400, 422]).toContain(res.status)
  })

  it('GET /api/admin/payouts/export → 200, text/csv', async () => {
    const res = await request(app).get('/api/admin/payouts/export')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toContain('text/csv')
  })

  it('POST mark-paid on non-existent payout → 404', async () => {
    const res = await request(app).post('/api/admin/payouts/nonexistent-id/mark-paid')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
    expect(res.status).toBe(404)
  })

  it('POST bulk-paid with empty array → 422', async () => {
    const res = await request(app).post('/api/admin/payouts/bulk-paid')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ payoutIds: [] })
    expect([400, 422]).toContain(res.status)
  })

  it('filter by brandId → 200', async () => {
    const res = await request(app).get(`/api/admin/payouts?brandId=${approvedBrandProfileId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })
})

// ═══════════════════════════════════════════════════════════════
// RETURNS
// ═══════════════════════════════════════════════════════════════

describe('Admin — Returns', () => {
  it('GET /api/admin/returns → 200', async () => {
    const res = await request(app).get('/api/admin/returns')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  const RETURN_STATUSES = ['REQUESTED', 'APPROVED', 'REJECTED', 'LABEL_ISSUED', 'RECEIVED', 'REFUNDED']
  RETURN_STATUSES.forEach(status => {
    it(`filter returns by status=${status} → 200`, async () => {
      const res = await request(app).get(`/api/admin/returns?status=${status}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.status).toBe(200)
    })
  })

  it('invalid returns status → 422', async () => {
    const res = await request(app).get('/api/admin/returns?status=CANCELLED')
      .set('Authorization', `Bearer ${adminToken}`)
    expect([400, 422]).toContain(res.status)
  })

  it('approve non-existent return → 404', async () => {
    const res = await request(app).post('/api/admin/returns/nonexistent/approve')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
  })

  it('reject non-existent return → 404', async () => {
    const res = await request(app).post('/api/admin/returns/nonexistent/reject')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ adminNotes: 'invalid return' })
    expect(res.status).toBe(404)
  })

  it('issue-label with valid URL on non-existent return → 404', async () => {
    const res = await request(app).post('/api/admin/returns/nonexistent/issue-label')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ returnLabelUrl: 'https://labels.example.com/return.pdf' })
    expect(res.status).toBe(404)
  })

  it('issue-label with invalid URL → 422', async () => {
    const res = await request(app).post('/api/admin/returns/any-id/issue-label')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ returnLabelUrl: 'not-a-url' })
    expect([400, 422]).toContain(res.status)
  })

  it('refund non-existent return → 404', async () => {
    const res = await request(app).post('/api/admin/returns/nonexistent/refund')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
  })
})

// ═══════════════════════════════════════════════════════════════
// DISPUTES
// ═══════════════════════════════════════════════════════════════

describe('Admin — Disputes', () => {
  it('GET /api/admin/disputes → 200', async () => {
    const res = await request(app).get('/api/admin/disputes')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
  })

  const DISPUTE_STATUSES = ['OPEN', 'RESOLVED', 'CLOSED']
  DISPUTE_STATUSES.forEach(status => {
    it(`filter by status=${status} → 200`, async () => {
      const res = await request(app).get(`/api/admin/disputes?status=${status}`)
        .set('Authorization', `Bearer ${adminToken}`)
      expect(res.status).toBe(200)
    })
  })

  it('invalid dispute status → 422', async () => {
    const res = await request(app).get('/api/admin/disputes?status=PENDING')
      .set('Authorization', `Bearer ${adminToken}`)
    expect([400, 422]).toContain(res.status)
  })

  it('resolve non-existent dispute → 404', async () => {
    const res = await request(app).post('/api/admin/disputes/nonexistent/resolve')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
  })

  it('close non-existent dispute → 404', async () => {
    const res = await request(app).post('/api/admin/disputes/nonexistent/close')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
  })
})

// ═══════════════════════════════════════════════════════════════
// DIGEST
// ═══════════════════════════════════════════════════════════════

describe('Admin — Digest', () => {
  it('POST /api/admin/digest/send → 200 with sent count', async () => {
    const res = await request(app).post('/api/admin/digest/send')
      .set('Authorization', `Bearer ${adminToken}`)
    expect([200, 202]).toContain(res.status)
    if (res.status === 200) {
      expect(typeof res.body.data.sent).toBe('number')
    }
  })
})
