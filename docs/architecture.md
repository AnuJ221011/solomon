# Backend Architecture

> Last updated: June 2026 · PRD v3.0 · All features complete

## Design Philosophy

The backend uses **feature-based (modular) architecture**. Each business domain is a self-contained module under `src/features/`. Code is colocated by domain, not by layer. Adding a new feature means adding a new folder — no other feature is touched.

## Directory Structure

```
backend/
├── prisma.config.ts                  # Prisma 7 config — pg adapter, migration adapter
├── src/
│   ├── app.js                        # Express app: middleware, all route mounts
│   ├── server.js                     # Entry point: DB verify, Redis connect, FX refresh, listen
│   │
│   ├── config/
│   │   ├── env.js                    # Fail-fast env var validation on startup
│   │   ├── db.js                     # Prisma client with @prisma/adapter-pg
│   │   ├── redis.js                  # ioredis singleton
│   │   └── passport.js               # JWT strategy (Google OAuth — Phase 2)
│   │
│   ├── features/
│   │   ├── auth/                     # Signup, login, OTP, JWT refresh/rotate, password reset, store quiz
│   │   ├── brands/                   # Brand profile CRUD, storefront, dashboard, payout CSV
│   │   ├── products/                 # Product CRUD, ranked discovery, pg_trgm search, CSV bulk import
│   │   ├── photos/                   # Cloudinary upload: product photos (up to 8), logo, banner
│   │   ├── orders/                   # Multi-brand checkout, commission resolution, manual invoicing
│   │   ├── returns/                  # Opening + repeat order returns, admin dispute flow
│   │   ├── reviews/                  # Product reviews, brand responses, avg rating recalc
│   │   ├── buyers/                   # Server-side cart, saved items, buyer dashboard
│   │   ├── collections/              # Brand product collections
│   │   ├── promotions/               # Catalog/collection percentage discount promotions
│   │   ├── promoted/                 # Paid promoted listings — bid → admin activate → rank boost
│   │   ├── team/                     # Brand/buyer team members, role permissions
│   │   ├── messenger/                # In-platform messaging (buyer ↔ brand, order-tied)
│   │   ├── shopify/                  # Shopify store connect, product import, order push, webhooks
│   │   ├── crm/                      # Contact list, CSV import, share link campaigns
│   │   ├── shipping/                 # Per-zone rate config, Shiprocket quotes, custom rate fallback
│   │   ├── share-links/              # Shareable links, 0% commission attribution, password protection
│   │   ├── achievements/             # 5-level criteria engine, progress, level-up email, social card
│   │   ├── referrals/                # Buyer referral program, wallet credits, leaderboard
│   │   ├── payments/                 # PayPal create/capture/webhook, cart total calculator
│   │   ├── fx/                       # Frankfurter API fetch, Redis cache (6h), INR-base conversion
│   │   ├── geo/                      # ipapi.co geo-detect → country code + currency
│   │   └── admin/                    # Brand approvals, user management, payout management + CSV
│   │
│   └── shared/
│       ├── middleware/
│       │   ├── authenticate.js       # JWT guard; also optionalAuthenticate for public routes
│       │   ├── authorize.js          # Role-based access control
│       │   ├── validate.js           # Zod body/query validation
│       │   ├── rateLimiter.js        # global / auth / OTP limiters
│       │   └── errorHandler.js       # Global error handler, 404 handler
│       ├── utils/
│       │   ├── logger.js             # Winston (dev: pretty, prod: JSON)
│       │   ├── response.js           # sendSuccess / sendError
│       │   ├── token.js              # JWT generate/verify/rotate + Redis blocklist
│       │   ├── otp.js                # 6-digit OTP via Redis with lockout
│       │   ├── email.js              # All Resend templates (OTP, welcome, order, dispatch, return, referral, digest)
│       │   ├── currency.js           # FX rate helpers + convertFromINR
│       │   └── createError.js        # HTTP error factory
│       └── constants/
│           ├── achievements.js       # Level definitions, criteria, commission rates
│           ├── shipping.js           # Zone definitions, country → zone mapping
│           └── roles.js              # All enums (PAYOUT_SPEED, RETURN_STATUS, TEAM_ROLE, etc.)
│
├── prisma/
│   ├── schema.prisma                 # Full data model — 25+ models
│   └── seed.js                       # Dev seed: admin, sample brand, sample buyer
│
├── package.json
├── .env.example
└── .gitignore
```

## Feature Module Anatomy

Each feature follows the same internal structure:

```
features/<name>/
├── <name>.validator.js    # Zod schemas for body/query validation
├── <name>.service.js      # Business logic + Prisma queries
├── <name>.controller.js   # Thin layer — calls service, calls sendSuccess/sendError
├── <name>.routes.js       # Express Router with middleware applied
└── index.js               # Re-exports router + any service fns used cross-feature
```

Simpler features (messenger, geo, promoted) inline the service logic in `<name>.routes.js` rather than splitting into a separate service file.

**Rule:** Controllers call services. Services call Prisma and utilities. No Prisma in controllers. No `req`/`res` in services.

## Request Lifecycle

```
Client Request
    │
    ├── /api/payments/paypal/webhook → express.raw() (raw body for signature verification)
    │
    ▼
Helmet / CORS / Compression
    │
    ▼
cookieParser + express.json (2 MB limit) + express.urlencoded
    │
    ▼
Morgan HTTP logging
    │
    ▼
globalLimiter — 200 req / 15 min per IP
    │
    ▼
Feature Router
    ├── [opt] authLimiter / otpLimiter
    ├── [opt] optionalAuthenticate — attaches req.user without blocking (public feed)
    ├── [opt] authenticate — blocks unauthenticated
    ├── [opt] requireVerified — blocks unverified email
    ├── [opt] authorize(...roles) — role check
    ├── [opt] validate(schema) — Zod, 422 on failure
    ▼
Service → Prisma / Redis / External APIs
    ▼
sendSuccess / sendError
    ▼ (on throw)
errorHandler — P2002 → 409, P2025 → 404, ≥500 → generic in production
```

## Authentication Model

| Token | Storage | TTL | Purpose |
|---|---|---|---|
| Access token (JWT) | `Authorization: Bearer` header | 15 min | Authenticate API requests |
| Refresh token (UUID v4) | `httpOnly` cookie + Redis `refresh:<uuid>` | 30 days | Rotate to get new access token |

On rotation: old token is deleted from Redis, new UUID generated. Logout deletes the token from Redis immediately.

## Commission Resolution

Every marketplace order at checkout runs through `resolveCommissionRate()` in `orders.service.js`:

1. Query `UserShareLinkAttribution` for the buyer × brand pair within the last 30 days
2. Found → **0% commission**, `shareLinkId` stamped on the order
3. Not found → look up `brandProfile.achievementLevel`, apply tier rate (15%→10%)
4. Manual orders (invoicing tab) always **0% commission** regardless of attribution

## Order Lifecycle Triggers

When `updateOrderStatus()` transitions an order:

| Status → | Trigger |
|---|---|
| `CONFIRMED` | `recalculateAchievement(brandId)` → if level changes to L2, fires `processBonusIfEligible(brandId)` |
| `DISPATCHED` | `_updateAvgDispatchDays()` · `processReferralReward()` on first dispatch · `_triggerBuyerVerification()` · `pushOrderToShopify()` · dispatch email to buyer |

All triggers use `setImmediate()` so they don't delay the HTTP response.

## Product Discovery Ranking

`GET /api/products` with `sortBy=rank` (the default) fetches up to 4× the requested limit as candidates, scores each product, and returns the top N for the requested page.

**Scoring signals (highest → lowest weight):**

| Signal | Max score |
|---|---|
| Active promoted listing | +10–15 (bid-proportional) |
| Achievement level | +1–5 |
| Avg rating | +0–3 |
| On-time dispatch (≤5 days) | +2 |
| Product conversion rate | +0–3 |
| Catalogue freshness (< 7 days) | +3 |
| Buyer category interest match | +2 per match |
| Store type affinity | +1 |

When a buyer is authenticated, their `storeType`, `aesthetic`, and `categoryInterests` from the store type quiz are used for personalisation signals.

## Shipping Rate Resolution

`calculateShipping()` in `shipping.service.js`:

1. Determine zone from buyer's `countryCode`
2. Try Shiprocket real-time rate (requires `SHIPROCKET_EMAIL` + `SHIPROCKET_PASSWORD` env vars)
3. If Shiprocket unavailable or not configured → fall back to brand's custom rate table
4. If no custom rate for the zone → return `requiresQuote: true` (frontend shows "Contact brand")

## Caching Strategy

| Data | Key | TTL |
|---|---|---|
| FX rates | `fx:rates` | 6 hours |
| OTP codes | `otp:<email>` | 10 minutes |
| OTP lockout | `otp_lockout:<email>` | 15 minutes |
| OTP attempts | `otp_attempts:<email>` | OTP TTL |
| JWT refresh tokens | `refresh:<uuid>` | 30 days |
| PayPal access token | `paypal:access_token` | Token TTL − 60 s |
| Shiprocket auth token | `shiprocket:token` | 23 hours |

## API Conventions

- **Base path:** `/api`
- **Response envelope:** `{ success, message, data }` or `{ success, message, errors }`
- **Validation errors (422):** `errors` array with `{ field, message }` per failing field
- **Pagination response:** `{ data, total, page, limit, totalPages }`
- **Monetary values:** always stored in INR in DB; converted for display via FX cache
- **Fire-and-forget side-effects** (emails, Shopify push, achievement recalc): wrapped in `setImmediate()` with `.catch(logger.error)` — never block the response

## Error Handling

`express-async-errors` — no try/catch needed in route handlers. `errorHandler` middleware:
- Prisma `P2002` (unique constraint) → 409
- Prisma `P2025` (not found) → 404
- `statusCode < 500` → message passed through
- `statusCode ≥ 500` → generic "Internal server error" in production, full message in development
- All errors logged via Winston with path, method, and stack (dev only)
