# Solomon Bharat

> International B2B Wholesale Marketplace — connecting independent Indian brands with global retailers.

**Version:** MVP + Phase 1.5 · **PRD:** v2.1

## Overview

Solomon Bharat enables Indian artisan brands to reach international wholesale buyers (US, UK, EU, AU, etc.) without a dedicated sales team. Discovery is public; commerce is gated behind account creation at the moment of purchase intent.

## Monorepo Structure

```
solomon-bharat2/
├── backend/          # Node.js / Express API
└── frontend/         # Next.js 14 (coming soon)
```

## Quick Links

| Resource | Location |
|---|---|
| Backend setup | [docs/project-setup.md](docs/project-setup.md) |
| Architecture | [docs/architecture.md](docs/architecture.md) |
| API Reference | [docs/api-reference.md](docs/api-reference.md) |
| Database Schema | [docs/database-schema.md](docs/database-schema.md) |
| Environment Variables | [backend/.env.example](backend/.env.example) |
| PRD | `Solomon_Bharat_PRD_v2.1.pdf` |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), Tailwind CSS, shadcn/ui, Zustand, React Query |
| Backend | Node.js / Express, PostgreSQL, Prisma ORM, Redis |
| Auth | JWT (15 min access / 30 day refresh) + Google OAuth |
| Images | Cloudinary |
| Email / OTP | Resend |
| Payments | PayPal Business (MVP) |
| FX Rates | Open Exchange Rates |
| Geo-detect | ipapi.co |
| Infra | Vercel (frontend), Render (backend) |

## Development

```bash
# Backend
cd backend
cp .env.example .env    # fill in values
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Server starts on `http://localhost:5000`. Health check at `GET /health`.
