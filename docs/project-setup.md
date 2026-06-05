# Project Setup Guide

> Last updated: June 2026 · Backend v1.0.0 · PRD v3.0 · All features complete

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | ≥ 18.0.0 |
| PostgreSQL | ≥ 14 |
| Redis | ≥ 7 |
| npm | ≥ 9 |

## 1. Clone & Install

```bash
git clone <repo-url>
cd solomon-bharat2/backend
npm install
```

## 2. Environment Variables

```bash
cp .env.example .env
```

### Required Variables

| Variable | Description | Where to get |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Local PG or Render |
| `JWT_ACCESS_SECRET` | 64-byte random hex | `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | 64-byte random hex | Same command |
| `RESEND_API_KEY` | Email + OTP delivery | [resend.com/api-keys](https://resend.com/api-keys) |
| `CLOUDINARY_CLOUD_NAME` | Image upload | [cloudinary.com/console](https://cloudinary.com/console) |
| `CLOUDINARY_API_KEY` | Image upload | Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Image upload | Cloudinary dashboard |
| ~~`OPEN_EXCHANGE_RATES_APP_ID`~~ | No longer needed | FX rates now use [frankfurter.app](https://www.frankfurter.app) — free, no key required |
| `PAYPAL_CLIENT_ID` | Payment processing | [developer.paypal.com](https://developer.paypal.com) |
| `PAYPAL_CLIENT_SECRET` | Payment processing | PayPal developer dashboard |

### Optional Variables (safe defaults provided)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | HTTP server port |
| `NODE_ENV` | `development` | `development` \| `production` |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `CLIENT_URL` | `http://localhost:3000` | Frontend URL for CORS + redirect URLs |
| `EMAIL_FROM` | `noreply@solomonbharat.com` | Sender address for all Resend emails |
| `PAYPAL_MODE` | `sandbox` | `sandbox` \| `live` |
| `PAYPAL_WEBHOOK_ID` | _(empty)_ | PayPal webhook ID — optional in development |
| `OTP_EXPIRY_MINUTES` | `10` | OTP validity window |
| `OTP_MAX_ATTEMPTS` | `3` | Failed attempts before 15-minute lockout |
| `IPAPI_KEY` | _(empty)_ | ipapi.co paid tier key; free tier works without it |
| `SHIPROCKET_EMAIL` | _(empty)_ | Shiprocket login email — falls back to custom rates if unset |
| `SHIPROCKET_PASSWORD` | _(empty)_ | Shiprocket login password |

### Phase 2 Variables (not required for current build)

| Variable | Description |
|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Google OAuth redirect URI |

> Shopify credentials are not global env vars — each brand connects their own Shopify private app via the dashboard (`POST /api/shopify/store/connect`).

## 3. Database Setup

```bash
# Run all migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Seed dev data (admin, sample brand, sample buyer)
npm run db:seed
```

### Seed Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@solomonbharat.com` | `Admin@12345` |
| Brand | `artisans@example.com` | `Brand@12345` |
| Buyer | `buyer@example.com` | `Buyer@12345` |

> Change all seed passwords before any production use.

## 4. pg_trgm Extension (fuzzy product search)

Run once against your PostgreSQL database:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_name_trgm
  ON "Product" USING gin (name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_desc_trgm
  ON "Product" USING gin ("shortDescription" gin_trgm_ops);
```

These use raw SQL and are not in Prisma migrations. Run manually after `db:migrate`, or add them to a custom migration file.

## 5. Start Development Server

```bash
npm run dev
```

Server starts at `http://localhost:5000`.

Health check:
```bash
curl http://localhost:5000/health
# → { "status": "ok", "env": "development", "timestamp": "..." }
```

## 6. Service Setup

### Cloudinary
1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. Dashboard → copy Cloud Name, API Key, API Secret → paste into `.env`

### Resend
1. Sign up at [resend.com](https://resend.com)
2. Create an API key → set `RESEND_API_KEY`
3. Verify your sending domain (or use `onboarding@resend.dev` in development)

### PayPal
1. Sign up at [developer.paypal.com](https://developer.paypal.com)
2. Create a REST API app → copy Client ID and Secret
3. Set `PAYPAL_MODE=sandbox` for development, `live` for production
4. For webhooks: create a webhook in the PayPal dashboard → set `PAYPAL_WEBHOOK_ID`

### Shiprocket (optional — real-time shipping quotes)
1. Sign up at [app.shiprocket.in](https://app.shiprocket.in)
2. Set `SHIPROCKET_EMAIL` and `SHIPROCKET_PASSWORD`
3. If not set, shipping costs fall back to the brand's custom rate table — no errors

### Shopify (per-brand — no global setup needed)
Each brand connects their own Shopify store via the brand portal. No global config required.
Brands create a private app in their Shopify Admin → copy the access token → connect via `POST /api/shopify/store/connect`.

## 7. Production Deployment

### Backend (Render)
1. Create a **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo, root directory: `backend`
3. Build command: `npm install && npm run db:migrate:prod && npm run db:generate`
4. Start command: `npm start`
5. Set all required env vars from the table above
6. Set `NODE_ENV=production` and `PAYPAL_MODE=live`

### Database — Render PostgreSQL
Use Render's managed PostgreSQL. `DATABASE_URL` is auto-injected.
Run the pg_trgm SQL commands against the production database after first deploy.

### Redis — Render Redis or Upstash
Either Render Redis (same region as backend) or [Upstash](https://upstash.com) (serverless).
Set `REDIS_URL` to the connection string.

## 8. Available npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start with nodemon (auto-reload) |
| `npm start` | Start in production mode |
| `npm run db:migrate` | Apply pending migrations (dev) |
| `npm run db:migrate:prod` | Apply migrations (production — no prompt) |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:seed` | Seed dev data |
| `npm run db:studio` | Open Prisma Studio (browser DB explorer) |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix lint issues |

## 9. Nodemon Config (Development)

Add `nodemon.json` at `backend/` root to customise:

```json
{
  "watch": ["src"],
  "ext": "js,json",
  "ignore": ["src/**/*.test.js"]
}
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `Missing required env var: DATABASE_URL` | Ensure all required vars from Section 2 are in `.env` |
| `Redis connection refused` | Start Redis: `redis-server` or `docker run -p 6379:6379 redis` |
| `prisma generate` error after schema change | Run `npm run db:generate` |
| FX rates show stale data | Frankfurter is free with no key. Check network connectivity — `curl https://api.frankfurter.app/latest?base=INR` should return rates. |
| Cloudinary upload fails | Verify `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| Shiprocket returns null rates | Check credentials; system auto-falls back to custom rates — not an error |
| PayPal capture fails | Confirm `PAYPAL_MODE` matches the credentials (sandbox creds won't work in `live` mode) |
| Shopify import returns empty | Ensure the Shopify private app has `read_products` permission |
