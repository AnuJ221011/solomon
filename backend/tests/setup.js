import { vi } from 'vitest'

// ─── In-memory Redis mock ─────────────────────────────────────────────────────
// Replaces the real Redis client so tests don't need a running Redis instance.
vi.mock('../src/config/redis.js', () => {
  const store = new Map()
  const redis = {
    setex: vi.fn((key, _ttl, value) => { store.set(key, String(value)); return Promise.resolve('OK') }),
    get:   vi.fn((key) => Promise.resolve(store.get(key) ?? null)),
    del:   vi.fn((...keys) => { keys.flat().forEach((k) => store.delete(k)); return Promise.resolve(keys.flat().length) }),
    incr:  vi.fn((key) => { const v = (parseInt(store.get(key) ?? '0') + 1); store.set(key, String(v)); return Promise.resolve(v) }),
    expire: vi.fn(() => Promise.resolve(1)),
    connect: vi.fn(() => Promise.resolve()),
    quit:    vi.fn(() => Promise.resolve()),
    on:      vi.fn(),
    _store: store,   // exposed so tests can inspect/clear
  }
  return { default: redis }
})

// ─── Email mock ───────────────────────────────────────────────────────────────
// Prevents real emails being sent during tests.
vi.mock('../src/shared/utils/email.js', () => ({
  sendOtpEmail:           vi.fn().mockResolvedValue(true),
  sendWelcomeEmail:       vi.fn().mockResolvedValue(true),
  sendBrandApprovalEmail: vi.fn().mockResolvedValue(true),
  sendWeeklyDigest:       vi.fn().mockResolvedValue(true),
  sendOrderConfirmation:  vi.fn().mockResolvedValue(true),
  sendDispatchEmail:      vi.fn().mockResolvedValue(true),
}))

// ─── Deterministic OTP ────────────────────────────────────────────────────────
// generateOtp always returns '123456' so tests can call verify-email with a known code.
vi.mock('../src/shared/utils/otp.js', async (importOriginal) => {
  const original = await importOriginal()
  return { ...original, generateOtp: () => '123456' }
})
