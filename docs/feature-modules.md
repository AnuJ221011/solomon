# Feature Modules

> Last updated: June 2026 · PRD v3.0 — all features complete

Each module under `backend/src/features/` is a self-contained domain slice following the `validator → service → controller → routes → index` pattern.

## Module Registry

| Module | Path | Status | Responsibility |
|---|---|---|---|
| `auth` | `features/auth/` | ✅ | Buyer/brand signup (store quiz + attribution), login, OTP, JWT refresh/logout, password reset |
| `brands` | `features/brands/` | ✅ | Brand profile CRUD (incl. pickupPincode, payout speed), storefront, dashboard stats, payout CSV export |
| `products` | `features/products/` | ✅ | Product CRUD, ranked discovery feed (personalised + promoted), pg_trgm search, CSV bulk import |
| `photos` | `features/photos/` | ✅ | Cloudinary upload for product photos, logo, banner |
| `orders` | `features/orders/` | ✅ | Multi-brand checkout, commission resolution (0% share link / manual), opening order detection, manual invoicing. Triggers: achievement recalc, referral reward, avgDispatchDays, buyer verification, Shopify push, confirmation + dispatch emails |
| `returns` | `features/returns/` | ✅ | 30-day opening order returns (platform-absorbed), repeat returns, admin dispute flow, status emails |
| `reviews` | `features/reviews/` | ✅ | Product reviews, brand responses, avg rating recalculation |
| `buyers` | `features/buyers/` | ✅ | Server-side cart, saved products & brands, buyer dashboard |
| `collections` | `features/collections/` | ✅ | Brand curated product collections |
| `promotions` | `features/promotions/` | ✅ | Catalog/collection discount promotions |
| `promoted` | `features/promoted/` | ✅ | Paid promoted listings — brand bids, admin activates, ranking boost |
| `team` | `features/team/` | ✅ | Brand/buyer team member invite, role permissions |
| `messenger` | `features/messenger/` | ✅ | In-platform messaging (buyer ↔ brand, optionally tied to order) |
| `shopify` | `features/shopify/` | ✅ | Shopify store connect, product import, order push, webhook receiver |
| `crm` | `features/crm/` | ✅ | CRM contact management, CSV import, share link campaign sending |
| `shipping` | `features/shipping/` | ✅ | Per-zone rate config, Shiprocket real-time quotes with custom rate fallback |
| `share-links` | `features/share-links/` | ✅ | Shareable links, 0% commission attribution, password protection, per-link analytics |
| `achievements` | `features/achievements/` | ✅ | 5-level criteria engine (incl. avgDispatchDays), level-up email, progress endpoint, social card data |
| `referrals` | `features/referrals/` | ✅ | Buyer referral link, wallet credits, reward + bonus issuance, leaderboard, reward email |
| `payments` | `features/payments/` | ✅ | PayPal order creation, capture, webhook handler, cart total calculation |
| `fx` | `features/fx/` | ✅ | Open Exchange Rates fetch, Redis cache (6h), INR-base conversion |
| `geo` | `features/geo/` | ✅ | ipapi.co geo-detect → country code + currency suggestion |
| `admin` | `features/admin/` | ✅ | Brand approval/rejection, level override, user suspend/reactivate, payout management + CSV export, platform stats |

## No Pending Modules

All PRD v3.0 features are implemented. Deferred to Phase 2: **Google OAuth**.

## Key Cross-Feature Dependencies

| Caller | Uses | Reason |
|---|---|---|
| `auth.service` | `share-links.recordSignupAttribution` | Records 0% commission attribution on signup |
| `auth.service` | `referrals.recordReferralSignup` | Records referral token on new user signup |
| `orders.service` | `shipping.calculateShipping` | Compute shipping cost per brand at checkout |
| `orders.service` | `achievements.getCommissionRate` | Resolve achievement-tier commission rate |
| `orders.service` | `achievements.recalculateAchievement` | Triggered on CONFIRMED status |
| `orders.service` | `referrals.processReferralReward` | Triggered on first DISPATCHED order |
| `orders.service` | `referrals.processBonusIfEligible` | Triggered when brand hits L2 |
| `orders.service` | `shopify.pushOrderToShopify` | Sync new order to brand's Shopify store |
| `reviews.service` | `brandProfile.avgRating` | Recalculates avg rating after every review |
| `products.service` | `promoted.PromotedListing` | Active promotions boost ranking score |
| `crm.routes` | `share-links.ShareLink` | Campaign sends share link URL to CRM contacts |
| `server.js` | `fx.refreshFxRates` | Initial load + 6-hour interval refresh |
