# Solomon Bharat — Complete System Flow

> **Version:** PRD v3.2 · **Date:** June 2026
> B2B wholesale marketplace connecting independent Indian brands with international retailers.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [User Types & Access Levels](#2-user-types--access-levels)
3. [Authentication Flow](#3-authentication-flow)
4. [Brand Onboarding Flow](#4-brand-onboarding-flow)
5. [Buyer Onboarding Flow](#5-buyer-onboarding-flow)
6. [Discovery & Browse Flow](#6-discovery--browse-flow)
7. [Product Listing Flow (Brand)](#7-product-listing-flow-brand)
8. [Cart & Checkout Flow](#8-cart--checkout-flow)
9. [Order Pipeline](#9-order-pipeline)
10. [Returns & Disputes Flow](#10-returns--disputes-flow)
11. [Share Link (0% Commission) Flow](#11-share-link-0-commission-flow)
12. [Achievement System Flow](#12-achievement-system-flow)
13. [Buyer Referral Flow](#13-buyer-referral-flow)
14. [Brand Portal Flows](#14-brand-portal-flows)
15. [Buyer Dashboard Flows](#15-buyer-dashboard-flows)
16. [Payment & Payout Flow](#16-payment--payout-flow)
17. [Currency & Internationalisation Flow](#17-currency--internationalisation-flow)
18. [Data & State Architecture](#18-data--state-architecture)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      SOLOMON BHARAT                         │
│            B2B Wholesale Marketplace                        │
├──────────────┬──────────────────────────┬───────────────────┤
│   PUBLIC     │     BUYER SIDE           │    BRAND SIDE     │
│  (No login)  │  (Verified retailers)    │  (Approved brands)│
├──────────────┼──────────────────────────┼───────────────────┤
│ Browse feed  │  Place orders            │  List products    │
│ View brands  │  Track shipments         │  Manage orders    │
│ View PDPs    │  Buyer dashboard         │  Brand portal     │
│ Search       │  Referral program        │  Share links      │
│ Share links  │  Wallet & credits        │  Payouts          │
└──────────────┴──────────────────────────┴───────────────────┘
```

**Core principle:** Discovery is public, commerce is gated. The signup wall appears exactly at the moment of purchase intent.

**Commission principle:**
- Orders via marketplace discovery → standard rate (15% → 10% by achievement level)
- Orders via brand's own Share Link → **0% commission** for 30 days

---

## 2. User Types & Access Levels

| Role | Description | Key Actions |
|---|---|---|
| **Public visitor** | No account, no login | Browse, search, view PDPs, view share link pages |
| **Buyer** | Verified international retailer | Everything above + cart, orders, dashboard, referrals |
| **Brand** | Approved Indian artisan brand | List products, manage orders, brand portal, share links |
| **Admin** | Internal platform team | Approve brands, manage payouts, resolve disputes |

### Access Gate Matrix

```
Action                    │ Public │ Buyer │ Brand │ Admin
──────────────────────────┼────────┼───────┼───────┼──────
Browse catalogue          │  ✓     │  ✓    │  ✓    │  ✓
View PDP / wholesale price│  ✓     │  ✓    │  ✓    │  ✓
Add to cart               │  ✗ →🔐 │  ✓    │  -    │  ✓
Place order               │  ✗ →🔐 │  ✓    │  -    │  ✓
Save to favourites        │  ✗ →🔐 │  ✓    │  -    │  ✓
Contact brand             │  ✗ →🔐 │  ✓    │  -    │  ✓
Access /cart or /checkout │  ✗ →🏠 │  ✓    │  -    │  ✓
List products             │  ✗     │  -    │  ✓    │  ✓
Brand portal              │  ✗     │  -    │  ✓    │  ✓

✗ →🔐 = redirected to auth gate modal
✗ →🏠 = redirected to homepage with modal open
```

---

## 3. Authentication Flow

### 3.1 Auth Gate Modal Trigger

```
User clicks gated action
        │
        ▼
isAuthenticated?
   │         │
  YES        NO
   │         │
   ▼         ▼
Execute    Open AuthModal overlay
action     (page stays visible in bg,
           12px backdrop blur)
                │
                ▼
         Default tab: "Create account"
         (Log in tab also available)
                │
         ┌──────┴──────┐
         │             │
    Create account   Log in
         │             │
         ▼             ▼
    [Business name]  [Email]
    [Email        ]  [Password]
    [Password     ]  → POST /auth/login
    → POST /auth/signup
         │             │
         └──────┬──────┘
                ▼
         Store JWT access token
         (localStorage: sb_token)
         Set refresh token
         (httpOnly cookie, 30 days)
                │
                ▼
         Update useAuthStore:
         setUser(user), isAuthenticated = true
                │
                ▼
         closeAuthModal()
                │
                ▼
         Restore pending action
         (cart add, favourites, etc.)
```

### 3.2 Token Lifecycle

```
Access token (JWT)
  ├── TTL: 15 minutes
  ├── Stored: localStorage (key: sb_token)
  └── Sent via: Authorization: Bearer <token>

Refresh token
  ├── TTL: 30 days
  ├── Stored: httpOnly cookie (not accessible to JS)
  ├── Rotated on every use (old token invalidated in Redis)
  └── On 401: POST /auth/refresh → new access token + new refresh token

Session expiry flow:
  API call → 401 → POST /auth/refresh
                        │
              ┌─────────┴──────────┐
              │                    │
          Success               Failure (refresh expired)
              │                    │
         Retry original        Clear token + redirect
         request               to /?auth=login
```

### 3.3 Password Reset Flow

```
User clicks "Forgot password?"
        │
        ▼
Enter email → POST /auth/forgot-password
        │
        ▼
Resend sends 6-digit OTP (10-min expiry, max 3 attempts)
        │
        ▼
User enters OTP → POST /auth/verify-otp
        │
        ▼
Enter new password (min 8 chars, 1 number)
→ POST /auth/reset-password
        │
        ▼
Auto-login → redirect to dashboard/portal
```

---

## 4. Brand Onboarding Flow

Brands go through a gated 9-step application. Not all applicants are approved.

```
Step 1 — Submit Application
  Brand fills: Instagram/website URL, product category,
  city/state, SKU count, existing retail partnerships
        │
        ▼
Step 2 — Share Brand Story
  Instagram handle, year founded, brand values,
  short brand story (used on storefront)
        │
        ▼
Step 3 — Approval Review (24–48 hrs)
  Admin assesses: category fit, photography quality,
  brand positioning, retail validation
        │
   ┌────┴────┐
   │         │
APPROVED  REJECTED
   │         │
   ▼         ▼
Step 4    Email with
Create    reason sent.
Account   Can reapply
   │      after 30 days.
   ▼
Step 5 — Complete Brand Profile
  Display name, description, contact info,
  social handles, HQ city, logo, banner image

        │
        ▼
Step 6 — Configure Shipping Zones
  Select zones (Domestic, South Asia, SE Asia,
  Middle East, Europe, North America, Oceania)
  Set per-zone rates: flat rate or per-kg (INR)
  Configure free shipping thresholds per zone

        │
        ▼
Step 7 — Build Catalogue
  Add products: photos (1–8), descriptions,
  variants, wholesale prices (INR), MOQs,
  lead times, weights, HS codes
  Or: CSV bulk import / Shopify sync

        │
        ▼
Step 8 — Account Verification (if required)
  GST certificate or Udyam registration
  Required for certain categories or high-volume

        │
        ▼
Step 9 — Shop Goes Live
  Platform email confirmation sent
  Brand discoverable via search + feed
  Share Link channel immediately available
  Achievement: L1 Sprout (profile 100% + 3 active products)
```

### Brand Account States

```
Application submitted → PENDING
Admin approves        → APPROVED → can list, receive orders
Admin rejects         → REJECTED → email with reason, reapply after 30 days
Policy violation      → SUSPENDED → admin action required
```

---

## 5. Buyer Onboarding Flow

Lighter than brand onboarding. Email verification → browse → order.

```
Step 1 — Sign Up
  Select "Sign up to buy"
  Business name, email, password
  Agree to Buyer Terms
        │
        ▼
Step 2 — Store Profile
  Business name (shown on orders to brands)
  Country (geo-detected, sets currency + shipping zone)
  Phone (optional at signup, required before first order)
        │
        ▼
Step 3 — Store Type Quiz (optional, skippable)
  Q1: Store type (boutique / gift shop / subscription box /
      online store / pop-up / other)
  Q2: Aesthetic (minimalist / bohemian / artisan /
      luxury / contemporary / eclectic)
  Q3: Product interests (multi-select)
  → Seeds personalised discovery feed from day one
        │
        ▼
Step 4 — Email Verification
  6-digit OTP via Resend (non-blocking for browsing)
  Verification banner shown until confirmed
  Must verify before placing first order
        │
        ▼
Step 5 — Browse & Place First Order
  No further verification required upfront
  Business verification runs as background check
  post first order (non-blocking, results in 1 business day)
        │
        ▼
Step 6 — Background Business Verification
  Platform confirms wholesale eligibility
  Orders NOT held pending verification
  Most accounts verified within 1 business day
        │
        ▼
Step 7 — Team Setup (optional)
  Multi-location retailers invite team members
  Centralised account + payment management
```

### Post-Signup Behaviour

```
Signup complete
      │
      ├─ Auto-login (no separate login step)
      ├─ Restore pending action (cart add, order page)
      ├─ If via Share Link → record attribution (0% commission)
      ├─ If via referral link → queue referral reward
      └─ Welcome email via Resend
```

---

## 6. Discovery & Browse Flow

```
Visitor lands on site
      │
      ▼
Geo-detect via ipapi.co
  → Auto-suggest country + currency
  → Persisted to localStorage + buyer profile
      │
      ▼
Homepage
  ├─ Hero section (editorial photography)
  ├─ Shop by Category (8 categories)
  ├─ Featured Brands (horizontal scroll)
  └─ How It Works (3-step explainer)
      │
      ▼
Discovery Feed / Catalogue (/catalogue)
  ├─ Filter sidebar: Category, Ships To, Price Range
  ├─ Sort: Best match / Newest / Price asc/desc
  ├─ Product grid: 4 col (desktop) → 3 col (tablet) → 2 col (mobile)
  └─ Personalised ranking (if logged in buyer):
       • Store type quiz match score
       • Purchase + browsing history
       • Similar buyer behaviour
       • Seasonal relevance
       • Achievement level boost (Elite/Legend)
      │
      ▼
Product Detail Page (/products/[id])
  ├─ Brand bar (logo + name + achievement badge + MOQ)
  ├─ Photo gallery (2×2 grid → lightbox on click)
  ├─ Product info (name, price, tags, description)
  ├─ Variant selector + quantity stepper (min = MOQ)
  ├─ "Add to Cart" → triggers auth gate if not logged in
  └─ Expandable: Product Details / Shipping / Brand Story
      │
      ▼
Brand Storefront (/brands/[slug])
  ├─ Full-width banner + brand logo
  ├─ Brand header (name, location, achievement badge, description)
  ├─ Collections tab bar (if brand has collections)
  └─ Product grid (same as catalogue, filtered to brand)
```

### Search Ranking Signals

| Signal | Weight |
|---|---|
| Impression-to-order conversion rate | High |
| On-time shipment rate | High |
| Response time to buyer messages | Medium |
| Review rating + volume | High |
| Catalogue completeness | Medium |
| Catalogue freshness (new listings ≤30 days) | Medium |
| Tag / category match quality | Medium |
| Achievement level (Elite/Legend get boost) | Low |
| Store type quiz match score | High (personalised) |
| Seasonal relevance | Medium |

---

## 7. Product Listing Flow (Brand)

5-step listing flow with autosave every 30 seconds.

```
Step 1 — Upload Photos
  1–8 photos per product
  Drag-to-reorder
  Cloudinary auto-crop to 1:1 square (c_fill,ar_1:1,q_auto,f_auto)

Step 2 — Core Details
  Product name (80 chars), category/subcategory (up to 2),
  short description (160 chars), full description (rich text),
  country of origin, HS/tariff code, tags (up to 10)

Step 3 — Pricing & Wholesale Terms
  Wholesale price (INR), MOQ (per SKU or per order),
  lead time (1–3 days / 1–2 weeks / 2–4 weeks),
  weight (grams, used for per-kg shipping + Shiprocket quotes)

Step 4 — Variants (optional)
  Up to 3 variant types (e.g. colour, size, material)
  Each variant: separate stock status, optional price override

Step 5 — Preview & Publish
  Live retailer preview panel updates as fields are filled
  Availability toggle: Active / Inactive / Coming soon
  Publish → product live + searchable
```

### Additional Listing Tools

- **CSV bulk import** — brands with large catalogues
- **Duplicate listing** — speeds up catalogue building
- **Shopify two-way sync** — products, orders, inventory, cancellations
- **Collections** — brand groups products into named sets visible on storefront
- **Promotions** — percentage discount on full catalogue or specific collections

---

## 8. Cart & Checkout Flow

```
Buyer adds item to cart (auth gate triggers if not logged in)
        │
        ▼
Multi-brand cart (/cart)
  Items grouped by brand:
  ┌─────────────────────────────────┐
  │  Ananta Handlooms               │
  │  ├── Silk Saree × 2  ₹4,800    │
  │  └── Cotton Dupatta × 5 ₹2,500 │
  ├─────────────────────────────────┤
  │  Jaipur Blue Studio             │
  │  └── Blue Pottery Bowl × 10 ₹3,000│
  └─────────────────────────────────┘
  
  Per brand: MOQ check, shipping cost, dispatch window
  Right panel: order summary with subtotals + total
        │
        ▼
MOQ validation at checkout
  Each brand's MOQ enforced independently
        │
        ▼
Checkout (/checkout)
  1. Confirm shipping address
  2. Review per-brand shipping costs + delivery windows
  3. Apply wallet credits (pro-rata across brand orders)
  4. Select payment: PayPal
  5. Place order → each brand generates independent order
        │
        ▼
Post-checkout
  ├─ Cart cleared
  ├─ Confirmation email → buyer + each brand (via Resend)
  ├─ Share Link attribution recorded (if applicable)
  └─ Orders appear in buyer dashboard + each brand's portal
```

---

## 9. Order Pipeline

```
PENDING → CONFIRMED → PROCESSING → DISPATCHED → DELIVERED
                                        │
                                    DISPUTED
                                        │
                                    CANCELLED
```

### Status Definitions

| Status | Meaning | Who sets it |
|---|---|---|
| `PENDING` | Order placed, awaiting brand confirmation | Auto (on checkout) |
| `CONFIRMED` | Brand has accepted the order | Brand |
| `PROCESSING` | Brand preparing/packing the order | Brand |
| `DISPATCHED` | Shipped with tracking number | Brand (enters tracking #) |
| `DELIVERED` | Auto-detected from carrier or buyer confirms | Carrier API / Buyer |
| `DISPUTED` | Buyer has raised an issue | Buyer |
| `CANCELLED` | Order cancelled | Brand or Admin |

### Order Detail Flow (Brand Side)

```
New order arrives in portal
        │
        ▼
Brand reviews: items, buyer info, shipping address, zone
        │
        ▼
Brand clicks "Confirm Order" → status: CONFIRMED
        │
        ▼
Brand packs + ships → enters tracking number
Status: DISPATCHED → buyer notified automatically
        │
        ▼
Carrier delivers → status: DELIVERED (auto or manual)
        │
        ▼
Payout initiated per brand's chosen payout speed:
  Standard: 30 days post-dispatch (no fee)
  Express:  Next business day post-dispatch (2.5% fee)
```

### Opening Order Policy

> A buyer's **first order from any brand** qualifies as an opening order:
> - Free returns within 30 days, no questions asked
> - Brand still receives full payout — platform absorbs return cost
> - After opening order, brand's stated return policy applies

---

## 10. Returns & Disputes Flow

### Opening Order Return

```
Buyer's first order from Brand X
        │
        ▼
Buyer initiates return (within 30 days) via dashboard
        │
        ▼
Platform records return request
        │
        ▼
Brand receives payout IN FULL (platform absorbs cost)
        │
        ▼
Return shipping label issued
        │
        ▼
Items returned → case closed
```

### Damaged / Missing / Incorrect Items

```
Buyer files report in portal
  (fills: issue type, description, photos if applicable)
        │
        ▼
Admin reviews claim (within 2 business days)
        │
        ▼
Admin mediates between buyer and brand
        │
   ┌────┴────┐
   │         │
Replacement  Refund
   │         │
   ▼         ▼
Brand creates  PayPal refund
new order      issued to buyer
(charged when
fulfilled)
```

### Review System

```
Order marked DELIVERED
        │
        ▼
Buyer prompted to leave review (star + text)
        │
        ▼
Review published on brand storefront
        │
        ├─ Brand can respond publicly
        ├─ Buyer can edit/remove if resolved
        └─ Score feeds brand's search ranking + achievement criteria
```

---

## 11. Share Link (0% Commission) Flow

### Visitor Journey via Share Link

```
Brand creates Share Link in portal
  (target: storefront / collection / single product)
  (optional: custom slug, expiry date, password, currency lock)
        │
        ▼
Brand shares link via WhatsApp / email / Instagram
URL format: solomonbharat.com/s/[brand-slug]/[custom-name]
        │
        ▼
Visitor opens link
        │
        ▼
Token stored in sessionStorage (persists on dismiss)
Sticky banner displays below nav:
  "[Brand Name] invited you to their wholesale catalogue
   — create a free account to place orders"  [Sign up free]
        │
        ▼
Visitor browses freely (public access, no login needed)
        │
        ▼
Visitor clicks "Add to Cart"
        │
        ▼
Auth gate modal opens (page stays visible behind blur)
        │
   ┌────┴────┐
   │         │
New user   Existing user
Signup     Login
   │         │
   └────┬────┘
        │
        ▼
Share Link token read from sessionStorage
Attribution recorded on buyer account
0% commission applies for 30 days
        │
        ▼
Cart action resumes (item added)
        │
        ▼
Order placed → 0% commission (vs standard 15%)
Brand sees in analytics: signups, orders, commission saved
```

### Attribution Window

```
Day 0: Buyer signs up via Share Link → 0% commission starts
Day 1–30: ALL orders from this buyer = 0% commission
Day 31+: Orders via organic marketplace = standard rate
          Orders via another Share Link = 0% commission (new 30-day window)
```

---

## 12. Achievement System Flow

5 sequential levels. No skipping. Background job recalculates after every confirmed order.

```
L1 SPROUT ──────────────────────────────────────────────
  Unlock criteria: Profile 100% complete + 3 active products
  Benefits: Listed on platform, basic search visibility,
            Share Links, Invoicing tool
  Commission: 15%
        │  (after 5 confirmed orders + avg dispatch ≤5 days + 0 disputes)
        ▼
L2 RISING ──────────────────────────────────────────────
  Unlock criteria: 5 confirmed orders + fast dispatch + clean record
  Benefits: "Rising Brand" badge, weekly newsletter feature
  Commission: 14%
        │  (after 25 orders + avg rating ≥4.2 + 10 active products)
        ▼
L3 TRUSTED ─────────────────────────────────────────────
  Unlock criteria: 25 orders + 4.2+ rating + 10 active products
  Benefits: "Trusted" badge, boosted search ranking,
            promotional banner slots, CSV bulk import
  Commission: 14% (unchanged; benefit = visibility)
        │  (after 100 orders + 4.5+ rating + ₹5L GMV + 0 disputes)
        ▼
L4 ELITE ───────────────────────────────────────────────
  Unlock criteria: 100 orders + 4.5+ rating + ₹5L GMV + clean
  Benefits: "Elite" badge, homepage featured rotation,
            dedicated account support
  Commission: 12%
        │  (after 500 orders + 4.7+ rating + ₹25L GMV + 3 repeat intl buyers)
        ▼
L5 LEGEND ──────────────────────────────────────────────
  Unlock criteria: 500 orders + 4.7+ rating + ₹25L GMV + 3 repeat intl buyers
  Benefits: Permanent homepage slot, co-branded marketing,
            early access to new features
  Commission: 10% (negotiable for top GMV brands)
```

### Achievement Unlock Event

```
Criteria met → background job detects unlock
        │
        ▼
In-app notification + email via Resend
Shareable social card generated
Badge displayed on:
  ├─ Brand storefront header
  ├─ Product cards (top-left overlay)
  └─ Search results
```

---

## 13. Buyer Referral Flow

Buyers earn store credit by referring brands to the platform.

```
Buyer gets unique referral link from dashboard
  → solomonbharat.com/join/brand?ref=[buyer-token]
        │
        ▼
Buyer shares link with a brand they want on the platform
        │
        ▼
Brand clicks link → token stored on new brand account
        │
        ▼
Brand completes application + reaches L1 Sprout
        │
        ▼
Brand's FIRST confirmed + dispatched order placed
        │
        ▼
Buyer receives ₹500 store credit
  ├─ Notification email via Resend
  ├─ Credit visible in Wallet tab
  └─ Applied automatically at checkout (or manual toggle)
        │
        ▼
BONUS: If referred brand reaches L2 within 90 days
  → Additional ₹500 credit issued
```

### Anti-Abuse Rules

- Credit only issues after first **confirmed + dispatched** order (not mere signup)
- Self-referral detection → auto-suspend pending admin review
- No cap on referrals per buyer account
- Credits expire after 12 months

---

## 14. Brand Portal Flows

### Orders Tab

```
All orders view
  │
  ├─ Filter tabs: All / Pending / Processing / Dispatched / Delivered / Disputed
  ├─ Search: by buyer name, order #, SKU
  ├─ Filter: by ship date, order type (marketplace vs share link), zone
  │
  ├─ Row click → Order detail slide-in panel (480px right drawer)
  │     ├─ Buyer info, items list, status badge
  │     ├─ Tracking number input (for PROCESSING orders)
  │     └─ Dispute flag + notes
  │
  └─ Bulk dispatch: select multiple orders → enter tracking → mark dispatched
```

### Payouts Tab

```
Payout speed selection (per-payout or as default):
  Standard (Net 30) — no fee
  Express (Next Day) — 2.5% fee on subtotal + shipping reimbursement
        │
        ▼
Payout table: Order # / Gross / Commission rate+amount / Net / Status
Status: PENDING → PROCESSING → PAID
        │
        ▼
Clear split: Marketplace orders (15–10%) vs Share Link orders (0%)
Commission saved counter (lifetime, month, per-link)
        │
        ▼
Export: CSV payout reports by date range
```

### Analytics Tab

```
Time range: 30 days / 90 days / 12 months
        │
        ├─ GMV trend (AreaChart — Recharts)
        ├─ Orders this month vs last month
        ├─ Avg order value trend
        │
        ├─ Product analytics: views, add-to-cart rate, orders, units sold
        │
        ├─ Customer geography:
        │    World map heatmap (SVG) + top 5 countries list
        │
        └─ Share Link analytics:
             Per-link: views, visitors, signups, orders, revenue, commission saved
```

### Share Links Tab

```
All active links with per-link analytics
        │
        ▼
Create Link modal:
  ├─ Target: full storefront / specific collection / single product
  ├─ Custom slug (solomonbharat.com/s/[brand]/[slug])
  ├─ Optional expiry date
  ├─ Optional password (private catalogue)
  ├─ Pre-set buyer currency
  └─ Custom welcome message
        │
        ▼
Per-link actions: Copy URL, WhatsApp share, Email share, Deactivate
        │
        ▼
Commission savings summary:
  Total commission saved via Share Links vs what marketplace rate would have been
```

### CRM / Email Tools

```
Upload retailer list (name, email, business name)
        │
        ▼
Segment audiences:
  ├─ First-time buyers
  ├─ Repeat buyers
  └─ Inactive (no order in 90 days)
        │
        ▼
Send targeted Share Link campaign
  → Convert existing wholesale relationships to 0% commission orders
        │
        ▼
Built-in email templates:
  ├─ New product announcement
  └─ Restock notification
```

---

## 15. Buyer Dashboard Flows

### Discovery Feed

```
Personalised product grid on /dashboard
        │
        ▼
Ranking based on:
  ├─ Store type quiz answers (aesthetic, category interests)
  ├─ Purchase history (brands bought from, categories)
  ├─ Browsing behaviour (products viewed, time spent)
  └─ "New from saved brands" alert strip (dismissible)
        │
        ▼
Standard ProductCard components with Add to Cart
```

### Order History

```
/dashboard/orders
        │
        ├─ Filter tabs: All / Pending / In Transit / Delivered / Disputed
        ├─ Columns: Order # / Brand / Status / Amount / Date / Track / Invoice
        │
        └─ Row click → Order detail sheet:
              ├─ Items list with images
              ├─ Status timeline (CONFIRMED → PROCESSING → DISPATCHED → DELIVERED)
              ├─ Tracking info
              └─ "Report Issue" → opens dispute flow
```

### Referral Hub

```
/dashboard/referrals
  ├─ Personal referral link (copy + WhatsApp + email share)
  ├─ Stats: brands referred / pending rewards / earned credits / leaderboard rank
  ├─ Referral history table
  └─ Leaderboard: top 5 referrers this month (anonymised)
```

### Wallet

```
/dashboard/wallet
  ├─ Available balance display (large, prominent)
  ├─ Auto-apply toggle (applied at checkout automatically)
  ├─ Credit history: Earned / Used / Expired entries
  └─ Credits expire after 12 months
```

---

## 16. Payment & Payout Flow

```
BUYER SIDE                           PLATFORM                    BRAND SIDE
──────────                           ────────                    ──────────
Buyer pays via PayPal           Funds land in platform         Brand receives payout
in local currency (USD/GBP/EUR) PayPal Business account        in INR
        │                              │                              │
        ▼                              ▼                              ▼
PayPal handles FX          Deduct commission:              Standard: 30 days
automatically              • 0%  — Share Link orders       post-dispatch
                           • 15% — L1 marketplace          (no fee)
                           • 14% — L2/L3 marketplace
                           • 12% — L4 marketplace          Express: next business
                           • 10% — L5 marketplace          day post-dispatch
                                   │                        (2.5% fee)
                                   ▼
                           Admin converts to INR
                           at daily bank rate
                                   │
                                   ▼
                           Payout via PayPal or
                           NEFT bank transfer
```

### Commission Structure Summary

| Order source | Commission |
|---|---|
| Marketplace (L1 Sprout) | 15% |
| Marketplace (L2 Rising) | 14% |
| Marketplace (L3 Trusted) | 14% |
| Marketplace (L4 Elite) | 12% |
| Marketplace (L5 Legend) | 10% |
| Share Link order (30-day window) | **0%** |
| Manual invoice (Invoicing tab) | 0% |
| PayPal processing fee (all orders) | ~2% + fixed fee |

---

## 17. Currency & Internationalisation Flow

```
First visit
      │
      ▼
ipapi.co/json → detect country + suggested currency
      │
      ▼
useCurrencyStore.setCurrency(detectedCurrency)
Preference saved to localStorage + buyer profile
      │
      ▼
Frankfurter API (free, no API key):
  GET https://api.frankfurter.app/latest?base=INR
  → exchange rates for 42 currencies
  → stored in useCurrencyStore.setRates()
  → refreshed every 6 hours (Redis cache on backend)
      │
      ▼
All prices stored in INR in database
Displayed in buyer's selected currency:
  displayPrice = priceINR × (rates[currency] / rates['INR'])
      │
      ▼
Checkout + invoices show BOTH:
  Local currency amount + INR equivalent
```

### Supported Currencies (42 total)

USD, GBP, EUR, AUD, CAD, SGD, AED, INR, JPY, CHF, SEK, NOK, DKK, NZD, HKD, MYR, THB, IDR, PHP, KRW, BDT, LKR, NPR, PKR, QAR, KWD, BHD, OMR, SAR, EGP, ZAR, BRL, MXN, ARS, CLP, COP, NGN, KES, TZS, GHS, TRY

---

## 18. Data & State Architecture

### Frontend State (Zustand stores)

```
useAuthStore
  ├─ user: User | null
  ├─ isAuthenticated: boolean
  ├─ isAuthModalOpen: boolean
  ├─ authModalTab: 'login' | 'signup'
  └─ pendingAction: string | null

useCartStore
  ├─ items: CartItem[]
  └─ getItemsByBrand(): Record<string, CartItem[]>

useCurrencyStore
  ├─ currency: string (ISO 4217)
  ├─ rates: Record<string, number>
  └─ convertFromINR(amountINR): number
```

### API Request Flow

```
React component
      │
      ▼
React Query (useQuery / useMutation)
      │
      ▼
api.ts (Axios instance)
  ├─ baseURL: NEXT_PUBLIC_API_URL
  ├─ withCredentials: true (httpOnly cookie)
  └─ Authorization: Bearer <token>
      │
      ▼
Express backend (Node.js)
  ├─ JWT middleware validates token
  ├─ Prisma ORM → PostgreSQL
  └─ Redis (cache + session)
```

### Key Database Entities

```
User ←──── BuyerProfile / BrandProfile
  │
  ├── Product ←── ProductVariant, ProductImage
  │      │
  │      └── OrderItem
  │
  ├── Order ←── OrderItem, OrderStatus history
  │
  ├── Payout ←── Order
  │
  ├── ShareLink ←── ShareLinkAttribution, ShareLinkView
  │
  ├── Achievement ←── AchievementCriteria
  │
  ├── WalletCredit ←── ReferralRecord
  │
  └── Review ←── Order
```

### Image Pipeline (Cloudinary)

| Asset | Transformation | Usage |
|---|---|---|
| Product photos | `c_fill,ar_1:1,q_auto,f_auto` | All product cards + PDP |
| Brand logos | `c_fill,ar_1:1,r_max,q_auto,f_auto` | Circle avatar use |
| Brand banners | `c_fill,ar_16:9,q_auto,f_auto` | Storefront hero |

---

*Solomon Bharat — System Flow Documentation · v3.2 · June 2026 · Confidential*
