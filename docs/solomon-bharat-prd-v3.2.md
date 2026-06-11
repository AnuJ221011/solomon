# Solomon Bharat — Product Requirements Document v3.2

> **Status:** Draft · **Date:** June 2026 · **Scope:** Full Platform — Single Build

**v3.2 Changelog:** Section 21 (UI/UX Specification) added. Defines the Global Premium Editorial design direction, full design token system (colour, typography, spacing, shape), component specifications (buttons, product cards, inputs, status badges, achievement badges, auth gate modal, sticky banner, data tables), and page-level specifications for Homepage, Catalogue, PDP, Brand Storefront, Brand Dashboard, and Buyer Dashboard. Explicit prohibition list codified. Implementation notes for CSS architecture, fonts, Cloudinary transforms, breakpoints, charts, and motion.

**v3.1 Amendment:** MSRP / retail price fields removed from Product and ProductVariant models — margin display removed from all buyer-facing UI. FX provider updated to Frankfurter (free, no API key). Supported currencies expanded to 42. Tech stack updated to Next.js 16 + shadcn/ui v4.

**v3.0 Changelog:** Complete rewrite from v2.1. All features collapsed into a single build — no Phase 2 deferral. Integrated full Faire-equivalent platform flows: brand onboarding (9-step application), buyer onboarding (store type quiz + background verification), multi-brand cart, order pipeline, opening order returns, payout speed options, 0% commission on Share Link orders, full brand portal (CRM, invoicing, collections, team management, promotions, Shopify sync), discovery algorithm signals, and returns & disputes framework.

**v3.0 Amendment:** Google OAuth (Sign in with Google) deferred — email + password authentication is the only signup method in the current build. Google OAuth will be added as a follow-on feature once the core platform is live.

---

## Table of Contents

1. [Executive Summary](#01-executive-summary)
2. [Goals & Success Metrics](#02-goals--success-metrics)
3. [User Personas](#03-user-personas)
4. [Internationalisation — Country, Currency & Shipping](#04-internationalisation--country-currency--shipping)
5. [Auth Gate & Signup Flow](#05-auth-gate--signup-flow)
6. [Brand Onboarding Flow](#06-brand-onboarding-flow)
7. [Buyer Onboarding Flow](#07-buyer-onboarding-flow)
8. [Product Listing](#08-product-listing)
9. [Discovery & Search](#09-discovery--search)
10. [Order Flow](#10-order-flow)
11. [Returns & Disputes](#11-returns--disputes)
12. [Seller Share Link — 0% Commission Channel](#12-seller-share-link--0-commission-channel)
13. [Achievement System — 5 Levels](#13-achievement-system--5-levels)
14. [Buyer Referral Program](#14-buyer-referral-program)
15. [Brand Portal](#15-brand-portal)
16. [Buyer Dashboard](#16-buyer-dashboard)
17. [Payment Architecture](#17-payment-architecture)
18. [Tech Stack](#18-tech-stack)
19. [Feature Prioritisation (MoSCoW)](#19-feature-prioritisation-moscow)
20. [Roadmap & Milestones](#20-roadmap--milestones)
21. [UI/UX Specification](#21-uiux-specification)

---

## 01 Executive Summary

Solomon Bharat is a B2B wholesale marketplace connecting independent Indian brands with international retailers. It is built as a complete platform in a single release — no features deferred to a second phase.

The platform mirrors the operational depth of mature wholesale marketplaces: a gated brand application process, a frictionless buyer signup, a multi-brand cart, a full order pipeline, opening order returns, payout speed options, a zero-commission channel for brands bringing their own customers (Share Links), and a brand portal that doubles as an off-platform wholesale management system.

> **Core principle:** Discovery is public, commerce is gated. Browsing and product previews require no login. The signup wall appears exactly at the moment of purchase intent.

> **Commission principle:** Orders originating from a brand's own Share Link pay 0% platform commission. Orders discovered organically via the marketplace pay the standard achievement-tier commission (15% down to 10%). This split is always visible in the brand portal.

---

## 02 Goals & Success Metrics

| Metric | Target |
|---|---|
| Brands at launch | 500+ |
| Countries supported | 40+ |
| Time to first listing (brand) | < 15 minutes |
| Buyer signup time | < 3 minutes |
| Referral conversion rate | 30% |
| Buyer satisfaction score | 4.5 / 5 |
| Share Link order rate (0% commission) | 40%+ of total GMV |
| GMV in first 12 months | ₹1 Crore+ |

---

## 03 User Personas

### Brand / Seller (India)
Small Indian artisan brand or manufacturer, 1–20 employees. Has an existing Instagram presence and some retail relationships. Wants wholesale reach without a dedicated sales team. Needs INR payouts, fast listing, achievement badges for credibility, and a zero-commission channel to bring their existing wholesale customers onto the platform.

### Retailer / Buyer (International)
Independent boutique, gift shop, or subscription box in the US, UK, EU, or Australia. Browses in local currency. May arrive via organic discovery or a brand's Share Link. Values unique, story-driven Indian products, clear shipping costs, and low-risk first orders (opening order return policy). Must create a verified account before ordering.

### Platform Admin
Internal team member who manages brand applications, buyer verifications, achievement validations, referral payouts, disputes, payout processing, and platform health via an admin dashboard.

---

## 04 Internationalisation — Country, Currency & Shipping

### Country & Currency Selector

- Geo-detection on first visit via ipapi.co — auto-suggest country and matching currency
- Preference persisted in buyer profile and localStorage; overridable from top nav at any time
- Supported currencies: USD, GBP, EUR, AUD, CAD, SGD, AED, INR, JPY, CHF, SEK, NOK, DKK, NZD, HKD, MYR, THB, IDR, PHP, KRW, BDT, LKR, NPR, PKR, QAR, KWD, BHD, OMR, SAR, EGP, ZAR, BRL, MXN, ARS, CLP, COP, NGN, KES, TZS, GHS, TRY (42 currencies total, INR-base)
- Exchange rates refreshed every 6 hours via Frankfurter API (free, no API key required); cached in Redis
- All prices stored in INR in the database; converted to display currency on the fly
- Checkout and invoice always show both local currency amount and INR equivalent
- Currency symbol and formatting respect locale conventions (£1,200.00 vs ₹1,00,000)

### Shipping Zones & Rates

- Brand sets per-zone rates: flat rate per order OR per-kg rate (brand's choice), set in INR
- Free shipping threshold configurable per zone
- Estimated delivery window per zone shown on product detail page and in cart
- If brand has not configured shipping for buyer's zone: 'Contact brand for shipping quote' CTA replaces Add to Cart
- Real-time shipping quotes via Shiprocket API (integrated at launch)
- **Shipping subsidy:** For brands that opt into platform free shipping promotions, Solomon Bharat covers shipping costs exceeding 13% of the order amount; brand absorbs up to that threshold

| Zone | Countries | Rate Type | Est. Delivery |
|---|---|---|---|
| Domestic | India | Flat / per kg | 3–7 days |
| South Asia | BD, LK, NP, PK | Flat / per kg | 7–14 days |
| Southeast Asia | SG, MY, TH, ID, PH | Flat / per kg | 10–18 days |
| Middle East | AE, SA, QA, KW | Flat / per kg | 10–18 days |
| Europe | UK, EU27 | Flat / per kg | 14–21 days |
| North America | US, CA | Flat / per kg | 14–21 days |
| Oceania | AU, NZ | Flat / per kg | 14–21 days |
| Rest of World | All others | Quote only | Variable |

---

## 05 Auth Gate & Signup Flow

All visitors can browse freely. A signup requirement is enforced precisely at the moment of purchase intent. No order can be placed by an unauthenticated or unverified user.

### Access Level Matrix

| Access Level | Allowed Actions | Blocked Actions |
|---|---|---|
| Public (no login) | Browse discovery feed, view brand storefront, view product detail page, see wholesale prices, view share link pages, search & filter | — |
| Authenticated buyer (email verified) | Everything above, plus: add to cart, place order, checkout, save to favourites, access buyer dashboard, use referral program | — |
| Unauthenticated user | Browse only | Add to cart, place order, checkout, save to favourites, referral program, direct URL access to /cart or /checkout |

### Auth Gate Trigger Behaviour

- Trigger actions: Add to Cart, Place Order, Save to Favourites, Contact Brand
- Gate renders as a centred modal overlay — the product/brand page stays visible behind it
- Modal default view is 'Create account' for first-time visitors; 'Log in' tab also available
- Intended action (cart item, product URL) stored in session; restored immediately after signup/login
- Closing the modal returns user to page with no loss of browsing context
- Direct URL access to /checkout or /cart while unauthenticated redirects to homepage with signup modal open

### Password & Session Rules

- JWT access token: 15-minute TTL; refresh token: 30 days, stored in httpOnly cookie
- Refresh token rotated on every use; old token invalidated in Redis
- Forgot password flow: OTP via Resend email; 10-minute expiry; 3 attempts max before 15-minute lockout
- Password requirements: minimum 8 characters, at least 1 number
- **Google OAuth (Sign in with Google) — deferred; email + password is the only auth method in the current build**

---

## 06 Brand Onboarding Flow

Brands go through a gated application before accessing the marketplace. Not all applicants are approved. The platform assesses category fit, brand quality, and market demand before granting access.

### Pre-requisites

- Registered business entity (sole proprietorship, partnership, or company)
- GST number or business registration number (required for payout eligibility)
- Minimum ~10 SKUs recommended with product photography
- At least one active social media presence (Instagram preferred)

### Onboarding Steps

**Step 1 — Submit Application**
Brand fills the seller application form: brand website or Instagram profile, product category, city/state, number of wholesale products available, and any existing international retail partnerships.

**Step 2 — Share Brand Story**
Provide Instagram handle, year founded, key brand values, and a short brand story (used on storefront). Platform assesses category supply/demand fit, brand positioning, and product photography quality.

**Step 3 — Approval Review**
Platform admin reviews the application within 24–48 hours. Factors: category demand, brand quality, product photography standard, and existing retail validation. Brand enters 'Pending' state. Rejection email sent with reason if not approved. Approved brands move to Step 4.

**Step 4 — Create Account**
Register with email + password. Must use a separate email from any existing buyer account. Agree to Terms of Service and Seller Agreement. 6-digit OTP email verification via Resend. *(Google OAuth — Phase 2)*

**Step 5 — Complete Brand Profile**
Fill in: brand display name, full description, contact info, social media handles, headquarters city, country of manufacture (default: India), logo, banner image. Wholesale business details and any existing international retail store relationships.

**Step 6 — Configure Shipping Zones**
Select which shipping zones the brand can fulfil orders to. Set per-zone rates (flat or per-kg). Optionally configure free shipping thresholds per zone. Zones with no rate configured show 'Contact for quote' to buyers.

**Step 7 — Build Catalogue**
Add product listings: titles, photos (min 1, max 8 per product), descriptions, variants, wholesale prices (INR), MSRP, MOQs, lead times, weights, HS codes. Can import via CSV bulk upload or Shopify two-way sync.

**Step 8 — Account Verification**
Identity and business ownership documents may be required for certain categories or high-volume applications. GST certificate or Udyam registration accepted.

**Step 9 — Shop Goes Live**
Platform emails confirmation. Brand is now discoverable via search, discovery feed, and eligible for marketing emails to relevant buyers. Share Link channel is immediately available. Achievement level starts at L1 Sprout once profile is 100% complete and at least 3 products are active.

### Brand Signup — Account States

| State | Description |
|---|---|
| `PENDING` | Application submitted; awaiting admin review |
| `APPROVED` | Approved; can list products and receive orders |
| `REJECTED` | Not approved; email with reason sent; can reapply after 30 days |
| `SUSPENDED` | Active brand suspended by admin for policy violation |

---

## 07 Buyer Onboarding Flow

Buyers have a lighter sign-up flow. They can start browsing immediately and place their first order with only email verification. Business verification runs as a background check after the first order.

### Eligibility

- Open and ready-to-trade business: brick & mortar, online store, pop-up, subscription box, or boutique
- Personal purchases and redistribution for personal use are not permitted
- Products must be resold in a country where the buyer is registered

### Onboarding Steps

**Step 1 — Sign Up**
Select 'Sign up to buy.' Provide business name, email, and password. Agree to Buyer Terms. Free to join. *(Google OAuth — Phase 2)*

**Step 2 — Store Profile**
Business name (required, shown on orders to brands), country (required, pre-filled from geo-detect, sets default currency and shipping zone), phone (optional at signup; required before first order).

**Step 3 — Store Type Quiz**
Platform asks 3–4 questions about store type (boutique, gift shop, subscription box, online-only, etc.), aesthetic (minimalist, bohemian, artisan, luxury, etc.), and product category interests (textiles, home décor, jewellery, food, etc.). Answers seed personalised discovery from day one. Skippable; can be updated in profile settings later.

**Step 4 — Email Verification**
6-digit OTP via Resend. Must be verified before placing first order. Non-blocking for browsing. Verification banner shown until confirmed.

**Step 5 — Browse and Place First Order**
No further verification required upfront. Buyer can browse and place orders immediately after email verification.

**Step 6 — Background Business Verification (post first order)**
After the first order is placed, the platform confirms the business meets wholesale eligibility. Most accounts are verified within one business day. Orders are not held pending verification — they proceed normally.

**Step 7 — Team Setup (optional)**
Multi-location retailers can invite team members. Each team member can place orders independently with centralised account management and payment.

### Post-Signup Behaviour

- User is immediately logged in — no separate login step required
- Intended action (add to cart, order page) is restored and executed
- If arrived via Share Link: link attribution recorded; seller gets credit in analytics
- If arrived via referral link: referral attribution recorded and pending reward queued
- Welcome email sent via Resend with account summary and getting-started guide

### Google OAuth Buyers

Google OAuth users skip email+password and business name entry (name and email pre-filled). Country is still required and shown as an editable pre-filled field. Email is auto-verified for Google signups.

---

## 08 Product Listing

5-step listing flow: (1) upload photos, (2) core details, (3) pricing & wholesale terms, (4) variants (optional), (5) preview and publish. Autosave draft every 30 seconds. Live retailer preview panel updates as fields are filled.

### Listing Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| Product name | Text (80 chars) | Yes | Shown in feed cards and search |
| Photos | Cloudinary upload (up to 8) | Yes (min 1) | Auto-crop to square; drag-to-reorder |
| Category / subcategory | Select (multi, up to 2) | Yes | |
| Short description | Text (160 chars) | Yes | Feed card text |
| Full description | Rich text | No | Product detail page |
| Wholesale price (INR) | Currency | Yes | Displayed in buyer currency |
| MOQ | Number | Yes | Per SKU or per order |
| Variants | Variant builder | No | Up to 3 variant types |
| Lead time | Dropdown | Yes | 1–3 days / 1–2 weeks / 2–4 weeks |
| Weight (grams) | Number | Yes | Used for per-kg shipping calc and Shiprocket quotes |
| HS / tariff code | Text | No | Helps buyers with import duties |
| Country of origin | Select | Yes | Required for customs |
| Shipping zones enabled | Multi-select | Yes | Zones brand can ship to |
| Tags | Tag input (up to 10) | No | pg_trgm searchable |
| Availability | Toggle | — | Active / Inactive / Coming soon |

### Additional Listing Tools

- **CSV bulk import** for brands with large catalogues
- **Duplicate listing shortcut** to speed up catalogue building
- **Shopify two-way sync:** products, orders, inventory levels, and cancellations sync automatically in both directions
- **Collections:** Brand can group products into named collections (e.g. 'Summer Edit', 'Under ₹2000 Wholesale') visible on their storefront
- **Brand specials / promotions:** Brand sets a percentage discount on their full catalogue or specific collections; featured under sale filters and during marketplace buying events
- PostgreSQL trigram search (pg_trgm) indexes on name, description, tags for fuzzy search

---

## 09 Discovery & Search

The platform personalises what each buyer sees. Brands compete for visibility across multiple surfaces.

### Discovery Surfaces

| Surface | How it works |
|---|---|
| Search & ranking | Powered by pg_trgm full-text + ranking signals. Personalised per buyer based on store type quiz answers, purchase history, and browsing behaviour. |
| Buyer recommendations | Brands shown based on what similar buyers (same store type, country, aesthetic) purchased, what the buyer searched or clicked, and seasonal trends. |
| Marketing emails | Platform sends curated weekly emails to buyers featuring relevant new brands and restocks, based on saved preferences and purchase history. |
| Promoted listings | Paid. Brands can promote listings to appear in top search and browse positions. Targeted to matched buyers by store type and location. |
| Brand specials / sales | Brands set percentage discount promotions, featured under a dedicated sale filter and during platform buying events. |
| Collections & filters | Brands curate product collections. Vertical-specific filters (textiles: fabric/technique; home décor: style/material; jewellery: metal/gemstone) help buyers navigate catalogues. |
| Share Link pages | Personalised landing pages from brand's own customer outreach; shown in public view with no login required. |

### Search Ranking Signals

- Impression-to-order conversion rate
- On-time shipment rate (dispatched within stated lead time)
- Response time to buyer messages
- Review rating and review volume
- Catalogue completeness (all fields filled, min photos, weight set)
- Catalogue freshness (new listings in last 30 days)
- Product tags, descriptions, and category match quality
- Achievement level (Elite and Legend brands receive a visibility boost)
- Seasonal relevance
- Store type quiz match score (buyer × brand category alignment)

### Store Type Quiz — Personalisation Seed

Asked during buyer onboarding (3–4 questions). Answers feed the recommendation engine from day one:
- Store type: boutique / gift shop / subscription box / online store / pop-up / other
- Aesthetic: minimalist / bohemian / artisan / luxury / contemporary / eclectic
- Product interests: textiles / home décor / jewellery / accessories / food & wellness / stationery / other

---

## 10 Order Flow

Each brand fulfils and ships orders independently. The platform handles payment collection and protects both sides.

### Step-by-step Order Flow

**Step 1 — Buyer browses and builds cart**
Multi-brand cart supported. Buyer adds products from multiple brands, reviews wholesale pricing in their local currency, checks MOQs, and sees shipping costs and estimated delivery windows per zone. Each brand's products are shown as a separate line group in the cart with the brand's estimated dispatch window.

**Step 2 — Checkout**
Buyer selects payment method (PayPal) and confirms shipping address. Each brand in the cart generates a separate order. Confirmation email sent to both buyer and brand. Cart is cleared.

**Step 3 — Brand receives and reviews order**
Brand sees the order in their portal under the Orders tab. Can view by status, search by buyer name, order number, or SKU, and filter by ship date. Brand can combine multiple open orders from the same buyer into one shipment.

**Step 4 — Brand fulfils order**
Brand ships directly to the buyer's address. Standard fulfilment window is the lead time stated on the product (1–3 days / 1–2 weeks / 2–4 weeks). Brand enters tracking number in the portal. Buyer receives shipping notification automatically.

**Step 5 — Buyer receives goods**
Buyer tracks the order via their dashboard. If items are missing, damaged, or incorrect, they file a report directly in the portal. Communication between buyer and brand happens through the platform's built-in messenger.

**Step 6 — Order complete**
Order moves to Delivered status (auto-detected from carrier tracking, or manually confirmed by buyer). Buyer may leave a product review. Review score feeds into the brand's search ranking. Brand payout is initiated per their chosen payout speed.

### Order Status Pipeline

```
PENDING → CONFIRMED → PROCESSING → DISPATCHED → DELIVERED
                                         ↓
                                     DISPUTED
                                         ↓
                                   CANCELLED
```

### Opening Order Policy

The buyer's **first order from any brand** qualifies as an opening order:
- Free returns within 30 days (shorter than domestic due to international shipping reality)
- No questions asked for opening order returns
- Brand is still paid out by the platform — Solomon Bharat absorbs the return cost for opening orders
- After the opening order, returns follow the brand's stated return policy

### Multi-brand Cart Rules

- Each brand's products are grouped separately in the cart
- MOQ is enforced per brand at checkout
- Shipping cost is calculated per brand per zone
- Each brand generates an independent order and payout
- Wallet credits are applied pro-rata across brand orders at checkout

---

## 11 Returns & Disputes

Return policies differ between opening orders and repeat orders. Brands are protected from payment loss even when a return is requested.

### Opening Order Returns

- Free returns within **30 days** on a buyer's first order from any brand
- Buyer logs the return in their portal. Brand still receives payout — platform absorbs the return cost
- No questions asked policy for opening orders

### Repeat Order Returns

- Each brand sets its own return policy (visible to buyers before purchase, configurable in brand portal)
- Defective or incorrect items are always covered by the platform regardless of the brand's stated policy

### Missing / Damaged / Incorrect Items Flow

1. **Report filed.** Buyer reports the issue in their portal with details and photos if applicable
2. **Platform reviews.** Admin reviews the claim and mediates between buyer and brand within 2 business days
3. **Return label issued.** Brand provides a prepaid return shipping label via the portal messenger if they want items returned
4. **Resolution.** Replacement order created (charged when fulfilled) or refund issued via PayPal

### Reviews

- Buyer can leave a star rating + text review after an order is marked Delivered
- Brand can respond publicly to any review
- If buyer and brand reach an understanding, buyer may edit or remove their review
- Review score directly affects the brand's search ranking and achievement criteria

> **Brand protection:** The platform guarantees brand payouts even when a buyer returns an opening order. For damaged or incorrect items on repeat orders, the platform covers the brand. Damage that occurs after the product has been resold to the end customer is the buyer's responsibility.

---

## 12 Seller Share Link — 0% Commission Channel

A zero-commission channel for brands who bring their own wholesale customers onto the platform. Buyers still get all platform benefits including opening order returns and easy checkout. This is equivalent to Faire's "Platform Direct" channel.

> **Commission rule:** When a buyer places an order through a brand's Share Link (the token is attributed to that buyer's account), the platform charges **0% commission** on all orders from that buyer for 30 days. After 30 days, any future orders from that buyer via organic discovery revert to the standard commission rate. Orders within the 30-day attribution window always show 0% commission in the brand's earnings panel.

### Share Link Visitor Experience

1. Visitor opens Share Link → page loads fully in public view
2. Sticky banner displayed: '[Brand Name] invited you to their wholesale catalogue — create a free account to place orders'
3. Visitor clicks Add to Cart → auth gate modal appears (page stays in background)
4. Visitor completes signup (or logs in if existing account)
5. Intended cart action resumes; Share Link attribution recorded → 0% commission applies
6. Brand sees in link analytics: signups, orders, revenue, and commission saved

### Sticky Banner Spec

- Position: top of page, below main nav, always visible while scrolling
- Content: '[Brand Name] invited you to their wholesale catalogue — create a free account to place orders'
- CTA button: 'Sign up free' — opens signup modal without navigating away
- Banner dismissible; Share Link token stays in sessionStorage on dismiss (attribution preserved)
- Banner hidden for already-authenticated visitors
- Already-authenticated visitors: prompted to confirm the attribution (one-click); 0% commission applied

### Share Link Attribution

- Share Link token stored in sessionStorage when visitor lands on the link page
- Token passed silently during signup and saved to the buyer's account record
- All orders from this buyer within **30 days** are attributed at 0% commission
- Brand sees: views, unique visitors, signups, orders placed, revenue, commission saved
- If buyer already has an account and logs in: attribution still recorded; 0% commission applies

### Link Configuration Options

- Link target: single product, product collection, or full brand storefront
- Custom slug: `solomonbharat.com/s/[brand-slug]/[custom-name]`
- Optional expiry date (link auto-deactivates)
- Optional password for private wholesale catalogue access
- Pre-set buyer currency: brand locks link to a specific display currency
- Custom welcome message shown at the top of the linked page
- One-click WhatsApp / email share from the link management panel

### Per-Link Analytics

- Views, unique visitors, signups, orders placed, conversion rate
- Revenue attributed to that specific link
- Commission saved (vs what would have been charged at standard rate)
- Top referral sources: direct, WhatsApp, email, Instagram

### Invoicing Tool (Off-platform Order Management)

Brands can create manual orders on behalf of any wholesale customer — including those not on the platform — directly from the Invoicing tab in the brand portal. This turns Solomon Bharat into the brand's off-platform wholesale order management system. Sales representatives can also enter orders on behalf of any customer. These manual orders are also 0% commission.

---

## 13 Achievement System — 5 Levels

Sequential brand progression system. Levels unlock in order; no skipping. Each level unlocks tangible platform benefits and commission reductions on marketplace-discovered orders. A background job recalculates each brand's progress after every confirmed order.

| Level | Name | Criteria to Unlock | Benefits Unlocked |
|---|---|---|---|
| L1 | Sprout | Profile 100% complete + at least 3 active product listings | Listed on platform; basic search visibility; access to Share Links; access to Invoicing tool |
| L2 | Rising | 5 confirmed orders + avg dispatch within 5 days + no disputes | 'Rising Brand' badge; weekly newsletter feature; commission reduced to 14% |
| L3 | Trusted | 25 confirmed orders + avg rating ≥ 4.2 + at least 10 active products | 'Trusted' badge; boosted search ranking; promotional banner slots; CSV bulk import |
| L4 | Elite | 100 confirmed orders + avg rating ≥ 4.5 + GMV ≥ ₹5L + 0 unresolved disputes | 'Elite' badge; homepage featured rotation; dedicated account support; commission 12% |
| L5 | Legend | 500 confirmed orders + avg rating ≥ 4.7 + GMV ≥ ₹25L + 3+ repeat international buyers | Permanent homepage slot; co-branded marketing; commission 10%; early access to new features |

### Achievement UX Rules

- Brand portal shows current level with visual progress bar toward next level's criteria
- Each criterion shows completion state: done / current count / remaining (e.g. '18 / 25 orders')
- Level unlock triggers in-app notification, email via Resend, and shareable social card
- Badge shown on brand storefront, product cards, and search results
- Admin can manually override level for verified founding brands during launch

---

## 14 Buyer Referral Program

Buyers refer new brands to the platform and earn store credit when the referred brand completes their first sale. Independent from the Share Link attribution system — both can apply to the same buyer account.

### Referral Flow

1. Buyer receives their unique referral link from the referral hub in their dashboard
2. Buyer shares link with a brand they want to see on the platform
3. Brand signs up via the referral link (token stored on new brand account)
4. Brand reaches Level 1 (Sprout) and completes their first confirmed dispatched order
5. Buyer receives store credit reward; notification sent via Resend email

### Reward Structure

- **Trigger:** Referred brand's first confirmed and dispatched order (not mere signup)
- **Reward:** Platform store credit — ₹500 applied to buyer's next order
- **Bonus:** If referred brand reaches Level 2 within 90 days, additional ₹500 credit issued
- No cap on number of referrals per buyer account
- Credits visible in buyer wallet; applied automatically at checkout; expire after 12 months
- Referral leaderboard: 'You've referred 3 brands — top 5% of buyers this month'

> **Anti-abuse:** Referral credit only issued after first confirmed dispatched order. Accounts flagged for self-referral are auto-suspended pending admin review.

---

## 15 Brand Portal

The brand portal functions as a wholesale command centre — orders, customers, marketing, analytics, and payout management in one place.

### Orders Tab

- View and manage all orders by status: Pending, Confirmed, Processing, Dispatched, Delivered, Cancelled, Disputed
- Search by buyer name, order number, or SKU
- Filter by ship date, order type (marketplace vs Share Link), and zone
- Combine multiple open orders from the same buyer into one shipment to reduce shipping costs
- Bulk dispatch update with tracking number entry
- Dispute flag with notes field

### Invoicing Tab

- Create manual orders for any wholesale customer, including those not on the platform
- Sales representatives can enter orders on behalf of any customer
- Manual orders are 0% commission
- Full off-platform wholesale order management capability
- Invoice PDF generation and email delivery

### Payouts Tab

- View all paid and pending payouts
- Commission breakdown per order: gross → commission rate → net INR
- Clear split between marketplace orders (15%–10% commission) and Share Link orders (0% commission)
- Filter by time frame and export payout reports (CSV)
- View payment processing fees per order
- Choose payout speed (see [Payment Architecture](#17-payment-architecture))

### Promotions

- Set percentage discount promotions on the entire catalogue or specific collections
- Required to participate in platform-wide buying events
- Platform can match or boost promotions during seasonal market periods
- Discounted products are featured under a dedicated sale filter visible to buyers

### Analytics

- **Performance overview:** GMV (INR + display currency), orders this month vs last, avg order value, page views, conversion rate. 30/90-day trend line chart.
- **Product-level analytics:** page views, add-to-cart rate, number of orders, units sold per product
- **Customer analytics:** buyer geography heatmap (world map), top 5 countries by order count, currency breakdown of revenue, repeat buyer rate
- **Share Link analytics:** per-link views, unique visitors, signups, orders, revenue, commission saved
- **Achievement progress:** current level badge, visual progress bar, each criterion with count/target, 'what unlocks next' preview card

### CRM / Email Tools

- Upload existing retailer list (name, email, business name)
- Filter audiences by purchase history (first-time buyers, repeat buyers, inactive)
- Send targeted Share Link campaigns to convert existing wholesale relationships to 0% commission orders
- Built-in email templates for new product announcements and restocks

### Share Links Tab (Platform Direct)

- Access all active Share Links with per-link analytics
- One-click create, copy, WhatsApp share, deactivate
- Commission savings summary: total commission saved via Share Link orders vs what marketplace rate would have been
- Track which buyers are attributed to Share Links

### Collections

- Curate grouped product collections on the brand storefront (e.g. 'New Arrivals', 'Summer Edit', 'Bestsellers')
- Attach collection-specific discount promotions
- Helps buyers navigate large catalogues more easily
- Collections shown on brand storefront and linkable via Share Links

### Team Management

- Invite team members with role-based permissions
- **Primary Admin:** original account owner; full access; cannot be removed
- **Admin:** full access to all portal features
- **Custom:** configurable access — can restrict visibility of payouts and analytics per member

### Integrations

- **Shopify two-way sync:** products, orders, inventory levels, and cancellations sync automatically in both directions
- New Shopify orders are pushed to Solomon Bharat; Solomon Bharat orders update Shopify inventory
- **CSV import/export:** bulk product import, order export, payout report export

### Dashboard Design Standards

- Sidebar navigation with collapsible sections; persistent on desktop, drawer on mobile
- Top bar: search, notification bell, currency switcher, profile avatar
- All data tables: sortable columns, export to CSV, pagination (20 rows default)
- Charts: recharts library, consistent colour palette, always labelled axes
- Empty states: illustrated placeholder + CTA, never a blank panel
- All monetary values show INR; toggle to show buyer currency equivalent
- Responsive: full sidebar on ≥1024px, bottom tab bar on mobile

---

## 16 Buyer Dashboard

### Key Panels

| Panel | Contents |
|---|---|
| Discovery feed | Personalised product feed based on store type quiz, purchase history, and saved brands. 'New from saved brands' alert. |
| Saved brands & products | Organised by category; quick reorder from saved items |
| Referral hub | Personal referral link, total brands referred, pending credits, earned credits, leaderboard rank |
| Wallet & credits | Available store credit balance, credit history, expiry dates, auto-apply toggle at checkout |
| Order history | All orders with status, tracking info, original currency + INR equivalent, invoice download |
| Team management | Invite team members; centralised payment and order visibility across locations |

### Dashboard Design Standards

Same as Brand Portal design standards (sidebar, responsive, sortable tables, recharts, empty states).

---

## 17 Payment Architecture

### Payment Parties

| Party | Location | Currency | Method |
|---|---|---|---|
| Customer (buyer) | International | Local currency (USD, GBP, EUR, etc.) | PayPal — handles FX automatically |
| Seller / brand | India | INR payout | Standard or Express payout (see below) |
| Platform | India | INR | Holds funds, deducts commission, distributes net to brand |

### Buyer Payment Methods

| Method | Timing |
|---|---|
| PayPal | Immediate charge at checkout; FX handled by PayPal |

### Brand Payout Speeds

| Option | Timing | Fee |
|---|---|---|
| Standard (Net 30) | Payment initiated 30 days after order is dispatched | No extra fee |
| Express (Next Day) | Transfer initiated the business day after dispatch confirmation | 2.5% processing fee on order subtotal + shipping reimbursement |

Brands select their preferred payout speed in the Payouts tab. Can be changed per-payout or set as default. Standard payout is the default.

### Commission Structure

| Scenario | Commission |
|---|---|
| New or repeat buyer via marketplace discovery | Standard rate (15% → 10% by achievement level) |
| Order via brand's Share Link (30-day attribution window) | **0% commission** |
| Manual order via Invoicing tab | 0% commission |
| Payment processing fee (all orders) | ~2% + fixed fee (PayPal standard) |
| Listing or monthly fees | None |

### Commission by Achievement Level (Marketplace Orders)

| Level | Commission Rate | Notes |
|---|---|---|
| L1 Sprout | 15% | Base rate |
| L2 Rising | 14% | −1% for reliability and dispatch speed |
| L3 Trusted | 14% | Unchanged; benefit at this level is visibility |
| L4 Elite | 12% | −2% for sustained volume and quality |
| L5 Legend | 10% | Lowest tier; negotiable for top GMV brands |

### Payment Flow

1. Buyer pays via PayPal in their local currency
2. Funds land in platform PayPal Business account (USD/GBP/EUR)
3. Platform deducts commission (0% for Share Link orders; level-based for marketplace orders) and records in payout ledger
4. Admin converts to INR at daily bank rate and initiates payout to brand via PayPal or NEFT bank transfer
5. Standard: 30 days post-dispatch. Express: next business day post-dispatch.

> Manual payout by admin is viable up to ~100 orders/month. When volume exceeds this, migrate to automated split payments via Stripe Connect or PayPal Commerce Platform (implementation is pre-planned in the codebase — see payments feature module).

---

## 18 Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16 (App Router), Tailwind CSS, shadcn/ui v4 (Base UI), React Query (TanStack), Zustand |
| Backend | Node.js / Express, PostgreSQL, Prisma ORM, Redis (cache + session store), pg_trgm (trigram search) |
| Infrastructure | Vercel (frontend), Render (backend), Cloudinary (images) |
| Auth | Self-managed JWT (access 15 min, refresh 30 days, httpOnly cookie) |
| Services | Resend (transactional email + OTP), PayPal Business (payments + payouts), Frankfurter API (FX — free, no key), ipapi.co (geo-detect), Shiprocket (shipping quotes) |
| Search | PostgreSQL pg_trgm + ranking signals computed in backend; no external search engine at MVP scale |
| Integrations | Shopify (two-way product/order/inventory sync via Shopify Admin API + webhooks) |
| Future (auto-triggers when volume demands) | Stripe Connect or PayPal Commerce Platform (automated commission splits) |

---

## 19 Feature Prioritisation (MoSCoW)

Everything is built in a single release. There is no Phase 2 deferral. The MoSCoW classification below reflects build sequencing priority within the single release.

| Priority | Features |
|---|---|
| **Must have** | Brand application + admin approval (9-step), buyer signup (store type quiz + OTP), auth gate modal, JWT email+password auth, product listing CRUD + Cloudinary, country/currency selector + FX cache (Redis), shipping zone config + Shiprocket quotes, discovery feed + pg_trgm search + ranking signals, brand storefront, product detail page, multi-brand cart, order pipeline (Pending → Delivered), Share Link with 0% commission + signup attribution, opening order returns (30-day), PayPal payments, standard payout (Net 30), brand portal (orders, payouts, share links, analytics), buyer dashboard |
| **Should have** | Achievement system (all 5 levels + criteria engine + badges), buyer referral program + wallet + credits, Express payout (Next Day, 2.5% fee), returns & disputes flow, product reviews + brand responses, Resend transactional emails (all triggers), brand CRM / email tools, collections (brand storefront), promotions / brand specials, invoicing tool (off-platform orders), team management (brand + buyer), buyer geography heatmap, forgot password OTP flow, mobile-responsive layout |
| **Could have** | Shopify two-way sync, social card generator for achievement unlocks, referral leaderboard, in-platform messenger, promoted listings (paid), link analytics deep-dive (referral source breakdown), store type quiz update from buyer profile settings, bulk CSV listing import |
| **Deferred (Phase 2)** | Google OAuth (Sign in with Google), automated commission splits (Stripe Connect), ERP API integrations, product video uploads, live chat support widget |

---

## 20 Roadmap & Milestones

All features ship in a single build. Milestones represent internal QA gates, not separate releases.

| Milestone | Target | Deliverables |
|---|---|---|
| M1 — Foundation + Auth | Week 1–4 | JWT auth (email + password), buyer signup (store type quiz + OTP), brand application flow (9 steps) + admin approval, auth gate modal, product listing CRUD + Cloudinary, country/currency selector + FX cache, shipping zone config. Seed 15 founding brands at L1. *(Google OAuth deferred)* |
| M2 — Discovery + Orders | Week 5–8 | pg_trgm search + ranking signals, discovery feed, brand storefront, product detail page, multi-brand cart, full order pipeline (Pending → Delivered), PayPal payment integration, Standard payout (Net 30). Closed beta: 50 brands, 100 buyers. |
| M3 — Share Links + 0% Commission | Week 9–10 | Share Link with 0% commission attribution, sticky banner, sessionStorage token, per-link analytics, invoicing tool. |
| M4 — Commerce Layer | Week 11–13 | Opening order returns (30-day), returns & disputes flow, product reviews + brand responses, Express payout (Next Day), Shiprocket shipping quotes, collections, promotions / brand specials. |
| M5 — Engagement + Growth | Week 14–16 | Achievement system (5 levels + criteria engine + badges + emails), buyer referral program + wallet + credits, brand CRM / email tools, team management, buyer geography heatmap, referral leaderboard. |
| M6 — Portal + Launch Polish | Week 17–20 | Full brand portal polish (analytics dashboard, payout reports, CSV export), full buyer dashboard polish, mobile audit, admin panel (approvals, payouts, dispute management), empty state illustrations, Resend all transactional email triggers. Target: 500 brands, 2,000 buyers at launch. |
| M7 — Integrations | Week 21–24 | Shopify two-way sync, promoted listings, social card generator, in-platform messenger. |

---

## 21 UI/UX Specification

> **Version:** 3.2 · **Added:** June 2026
> **Design direction:** Global Premium Editorial — functionally modelled on Faire.com / Ankorstore; editorial tone referencing Net-a-Porter Wholesale. Indian craft heritage lives in product stories, not in the visual language.

---

### 21.1 Design Philosophy

Solomon Bharat is an international B2B wholesale platform. Its primary users are wholesale buyers in the US, UK, EU, Australia, and the Middle East — people who regularly use Faire, Ankorstore, and similar global platforms. The design must feel globally polished and commercially familiar to that audience. It must not feel like a domestic Indian e-commerce site.

The design direction is "Global Premium Editorial":

- **Atmosphere:** Expensive, calm, and breathable. Generous whitespace. A gallery approach to commerce, not a bazaar.
- **Visual rhythm:** Balanced and asymmetrical grids inspired by high-end fashion trade publications.
- **Surface treatment:** Clean and flat. Interactions are deliberate and soft — the feel of turning a page in a physical catalogue.
- **Heritage principle:** Indian craft identity is expressed through product photography, brand stories, and place names (Varanasi, Jaipur, Kutch). It is never expressed through decorative UI motifs — no rangoli patterns, no saffron/orange accents, no festive animations, no dense banner grids.

The product photography is the hero. The UI is a precision frame around it.

---

### 21.2 Design Tokens

All tokens are implemented in `frontend/app/globals.css` as CSS custom properties, and exposed to Tailwind via `@theme` configuration in `frontend/tailwind.config.ts`.

#### 21.2.1 Colour Palette

| Token | CSS variable | Hex | Usage |
|---|---|---|---|
| `handmade-paper` | `--bg` | `#F9F7F2` | Primary canvas — marketplace browse surfaces |
| `raw-linen` | `--surface` | `#FCFAFA` | Gated dashboard surfaces (brand portal, buyer dashboard) — subtle visual shift from browse to work |
| `charcoal` | `--primary` | `#1A1A1A` | All primary text, primary buttons, icon strokes |
| `aged-brass` | `--accent` | `#A68B67` | Interactive highlights, active states, achievement iconography, focus rings, sticky banner background |
| `aged-brass` (hover) | `--accent-hover` | `#8B7055` | Hover state on `--accent` elements |
| `surface-container-low` | `--muted-bg` | `#F5F0E8` | Muted backgrounds (tag pills, empty state zones) |
| `on-surface-variant` | `--muted-text` | `#444748` | Secondary body text, field labels, captions |
| `subtle-border` | `--border-warm` | `#E5E1D8` | All container borders, dividers, table rules |
| `success-muted` | `--success` | `#6B7E6B` | Delivered / active status badges |
| `error` | `--error` | `#BA1A1A` | Error states, cancelled/disputed badges |
| `warning-muted` | `--warning` | `#C29D72` | Pending / processing status badges |

**Background strategy:** `handmade-paper` (`--bg`) for all public marketplace surfaces. `raw-linen` (`--surface`) for authenticated dashboard surfaces. The contrast is intentional — it provides a subtle psychological shift between browsing and working without breaking the tonal family.

**What is prohibited:** No saffron, turmeric orange, bright vermilion, or any high-chroma warm accent. No digital vibrancy. The palette is strictly organic and low-chroma.

#### 21.2.2 Typography

| Role | Typeface | Size | Weight | Usage |
|---|---|---|---|---|
| `display-lg` | Playfair Display | 48px | 600 | Hero headlines, brand name displays |
| `headline-lg` | Playfair Display | 32px | 500 | Page section titles, storefront headers |
| `headline-lg-mobile` | Playfair Display | 28px | 500 | Mobile equivalents of `headline-lg` |
| `headline-md` | Playfair Display | 24px | 500 | Product names on PDP, brand card names |
| `body-lg` | Public Sans | 18px | 400 | Brand story paragraphs, editorial copy |
| `body-md` | Public Sans | 16px | 400 | Product descriptions, form labels, table rows |
| `label-md` | Public Sans | 14px | 600 | UI labels, nav items, button text, status badges |
| `label-sm` | Public Sans | 12px | 500 | Secondary metadata, MOQ badges, category tags |
| `caption` | Public Sans | 12px | 400 | Timestamps, footnotes, legal fine print |

**Typography rules:**
- Playfair Display is reserved strictly for editorial moments: brand names, section headlines, hero copy, product names on PDP. Never for dashboard data, navigation, form fields, or body copy.
- Public Sans handles all utility UI: tables, navigation, prices, filters, form inputs, status labels.
- Letter-spacing on display sizes should be tightened (−0.02em at 48px) to reinforce the premium feel.
- Line heights: 1.1 for display, 1.2–1.3 for headlines, 1.5–1.6 for body.

Fonts loaded via Next.js `next/font/google` in `frontend/app/layout.tsx`:
- `Playfair_Display` → CSS variable `--font-playfair`
- `Public_Sans` → CSS variable `--font-public-sans`

#### 21.2.3 Spacing & Layout

| Token | Value | Usage |
|---|---|---|
| `margin-mobile` | 1.5rem | Horizontal page margin on mobile |
| `margin-desktop` | 4rem | Horizontal page margin on desktop (≥1024px) |
| `gutter` | 2rem | Column gutter in product grids |
| `section-gap` | 6rem | Vertical gap between major homepage sections |
| `unit` | 4px | Base spacing unit — all other spacing is multiples of this |

**Marketplace grid:** 12-column, `4rem` margins on desktop. Product grids use whitespace as a design element — rows must not feel overcrowded.

**Dashboard layout:** Fixed left sidebar (280px wide, sticky), fluid content area. Top bar: search input, notification bell, currency switcher, profile avatar.

**Mobile reflow:** Margins reduce to `1.5rem`. Product grid collapses from 4 columns → 2 columns. Dashboard sidebar collapses to a bottom tab bar (5 items max). Horizontal scrolling is prohibited; all content modules stack vertically.

#### 21.2.4 Shape & Elevation

**Corner radius:** 4px (`rounded` / 0.25rem) applied consistently to buttons, inputs, cards, and badges. This is the only radius used across the system — no pill-shaped buttons, no circle badges, no large radius cards.

**Depth and shadow:** The system uses tonal layering rather than heavy shadows. White/`raw-linen` cards sit on `handmade-paper` backgrounds. When elevation is required (product card hover), use a single diffused shadow only: `0 4px 20px rgba(26, 26, 26, 0.04)`.

**Borders:** 1px `--border-warm` (`#E5E1D8`) defines all containers. No box shadows for container definition.

**Product photography:** Always auto-cropped to 1:1 square aspect ratio via Cloudinary transformation.

---

### 21.3 Component Specifications

#### 21.3.1 Buttons

| Variant | Background | Text | Border | Hover |
|---|---|---|---|---|
| Primary | `--primary` (#1A1A1A) | White | None | Background lightens to `#333` |
| Secondary (ghost) | Transparent | `--primary` | 1px `--border-warm` | Background fills to `--muted-bg` |
| Accent | `--accent` (#A68B67) | White | None | Background darkens to `--accent-hover` |
| Destructive | `--error` | White | None | Opacity 90% |

All buttons: 4–6px border radius, `label-md` type (Public Sans 14px/600), 40px minimum height on desktop, 48px on mobile. No gradients.

#### 21.3.2 Product Cards

Used in the discovery feed, category pages, and search results.

- **Dimensions:** Square product image (1:1, Cloudinary auto-crop), fixed width in grid
- **Surface:** `--surface` background, 1px `--border-warm` border, 4px radius
- **Contents:** Product image → brand name (caption, `--muted-text`) → product name (`label-md`, `--primary`) → wholesale price (body-md, bold) → "/ unit" (caption) → MOQ badge (bottom-right corner, `label-sm`)
- **Hover state:** Border darkens to `--primary` at 30% opacity; soft elevation shadow `0 4px 20px rgba(26, 26, 26, 0.04)`; subtle image scale (1.02) within the card boundary
- **Achievement badge:** Displayed as a small coloured label overlaid top-left on the image, or inline below brand name (see §21.3.5)
- **Grid:** 4 columns on desktop (≥1280px), 3 columns on tablet (768–1279px), 2 columns on mobile (<768px)

#### 21.3.3 Input Fields

- Flat surface, 1px `--border-warm` border, 4px radius
- Focus state: 1px inner stroke of `--accent` (#A68B67) — no heavy glow, no blue browser default
- Error state: 1px border of `--error`, error message in `caption` style below field
- Label: `label-sm` above field in `--muted-text`
- Placeholder: `--muted-text` at 60% opacity

#### 21.3.4 Status Badges

Used in order tables, brand portal, and buyer dashboard.

| Status | Background | Text | Example |
|---|---|---|---|
| Active / Delivered | `--success` at 10% opacity | `--success` (#6B7E6B) | "Delivered" |
| Pending / Processing | `--warning` at 12% opacity | `--warning` (#C29D72) | "Pending" |
| Confirmed / Approved | `--accent` at 10% opacity | `--accent-hover` | "Confirmed" |
| Cancelled / Rejected | `--error` at 10% opacity | `--error` (#BA1A1A) | "Cancelled" |
| Disputed | `--primary` at 8% opacity | `--primary` | "Disputed" |

All badges: `label-sm` type, 4px radius, 4px vertical / 8px horizontal padding. No pill shapes.

#### 21.3.5 Achievement Badges

Displayed on brand storefronts, product cards, and search results.

| Level | Label | Badge colour | Text colour |
|---|---|---|---|
| L1 Sprout | "Sprout" | `--muted-bg` (#F5F0E8) | `--muted-text` |
| L2 Rising | "Rising Brand" | `--accent` at 15% opacity | `--accent-hover` |
| L3 Trusted | "Trusted" | `--accent` at 25% opacity | `--accent-hover` |
| L4 Elite | "Elite" | `--primary` at 8% opacity | `--primary` |
| L5 Legend | "Legend" | `--primary` (#1A1A1A) | White |

Badge dimensions: `label-sm` type, 4px radius, tight padding. Displayed inline — no large decorative icons or circles.

#### 21.3.6 Auth Gate Modal

- **Trigger:** Add to Cart, Place Order, Save to Favourites, Contact Brand (unauthenticated)
- **Layout:** Centred modal overlay. Two panels side by side on desktop; single panel (form only) on mobile.
  - **Left panel (desktop only):** Full-height warm editorial photography — Indian craft detail, natural light, no text overlay
  - **Right panel:** Form content
- **Backdrop:** Semi-transparent with 12px backdrop blur — the product or brand page behind remains visible, keeping the user's intent in context
- **Right panel contents:** Solomon Bharat wordmark (top), "Create account" / "Log in" tab switcher, email field, password field, primary CTA button ("Create account" or "Log in"), legal caption ("By signing up you agree to our Terms of Service"), close button (×, top-right)
- **Behaviour:** Default tab is "Create account" for first-time visitors. Intended action is restored immediately after signup/login. Closing returns user to page with no loss of context.
- **Dimensions:** Max-width 800px, max-height 560px, centred with `position: fixed`. Mobile: full-screen modal.

#### 21.3.7 Share Link Sticky Banner

Shown on all pages accessed via a brand's Share Link, to unauthenticated visitors.

- **Position:** Top of page, below main navigation — always visible while scrolling (sticky)
- **Background:** `--accent` (#A68B67) — full-width
- **Text:** "[Brand Name] invited you to their wholesale catalogue — create a free account to place orders" — `label-md` White
- **CTA:** "Sign up free" button — Secondary (white text, 1px white border) — opens signup modal without page navigation
- **Dismiss:** Dismissible with ×; Share Link token remains in sessionStorage on dismiss so attribution is preserved
- **Hidden for:** Already-authenticated visitors (who instead see a one-click attribution confirmation prompt)

#### 21.3.8 Achievement Progress Bar

Used in the Brand Portal overview.

- **Track:** 100% width, 4px height, `--border-warm` background
- **Fill:** `--accent` (#A68B67), animated fill on page load
- **Label:** Level name left-aligned above bar, next level right-aligned
- **Criterion list:** Below bar — each criterion displayed as "✓ 18 / 25 orders" — checkmark in `--success` when met, dash in `--muted-text` when pending

#### 21.3.9 Data Tables (Portal)

- Column headers: `label-sm`, `--muted-text`, uppercase, 0.05em letter-spacing
- Rows: `body-md`, `--primary`, 48px row height, 1px `--border-warm` bottom border
- Hover: row background fills to `--muted-bg` (#F5F0E8)
- Sortable columns: chevron icon appears on hover; active sort column header turns `--primary`
- Pagination: "Showing 1–20 of 143 orders" caption, Prev / Next buttons
- Default: 20 rows per page
- All tables: CSV export button (top-right of table, `label-sm` secondary button)
- Empty state: Illustrated placeholder (light line art) + action CTA — never a blank panel

---

### 21.4 Page Specifications

#### 21.4.1 Homepage

The homepage is browse-first — no login required. There is no hero carousel or rotating banner grid.

**Navigation bar (global)**
- Background: White / `--surface`, 1px `--border-warm` bottom border
- Left: Solomon Bharat wordmark (Playfair Display)
- Centre: Search input (desktop only, 480px max-width)
- Right: Country/currency selector, "Log in", "Sign up" (primary button)
- Height: 64px desktop, 56px mobile
- Sticky on scroll

**Hero section**
- Full-width, warm-toned editorial photography (Indian textiles or craft close-up — natural light, no models, no text in photo)
- Background: `--bg` (`#F9F7F2`) with image occupying 60vh minimum
- Headline: `display-lg` Playfair Display — "Discover India's Finest Wholesale Brands"
- Subheadline: `body-lg` Public Sans, `--muted-text` — "Curated artisan brands. Transparent pricing. Global shipping."
- Two CTAs: "Shop the Catalogue" (Primary button, `--primary`) + "Apply as a Brand" (Secondary ghost button)
- No auto-play animations, no text scroll effects

**Shop by Category section**
- Heading: `headline-md` Playfair Display — "Shop by Category"
- Layout: Horizontal scroll row (mobile), 8-column grid (desktop ≥1280px)
- Category cards: Square (160×160px), clean photography or minimal flat icon, category name in `label-md` below image
- Categories: Textiles, Home Decor, Jewellery, Accessories, Apparel, Food & Wellness, Art & Craft, Stationery
- No emojis. No decorative borders or gradients on category cards.

**Featured Brands section**
- Heading: `headline-md` Playfair Display — "Featured Brands"
- Layout: Horizontal scroll row, brand cards (240px wide)
- Brand card contents: Brand logo (80×80px, 1px `--border-warm` circle border), brand name (`headline-md`), location (e.g. "Varanasi, India", `caption`, `--muted-text`), achievement badge (§21.3.5), short tagline (`body-md`)
- "View all brands" text link at section end

**How It Works section**
- 3-column row (stacks to 1 column on mobile)
- Each column: minimal line icon (24px, `--muted-text`) + heading (`label-md`, `--primary`) + one-line description (`body-md`, `--muted-text`)
- Steps: "Browse the Catalogue" / "Add to Cart" / "Ships to You"
- No numbered circles, no heavy step connectors

**Trust strip**
- Single horizontal row, 4 items separated by 1px `--border-warm` vertical dividers
- Items: "500+ Artisan Brands" / "40+ Countries" / "0% Commission on Direct Orders" / "Opening Order Returns"
- Each item: small icon + `label-md` text, centred
- Background: `--muted-bg`

**Footer**
- Background: `--primary` (#1A1A1A)
- Text: White and `--muted-text` variants
- Layout: 4-column grid (logo + tagline / Marketplace links / Sellers links / Legal links) + bottom row (social icons, copyright)
- Solomon Bharat wordmark in Playfair Display, White

#### 21.4.2 Shop / Catalogue Page

**Left sidebar (desktop)**
- Width: 240px, sticky, does not scroll with page content
- Background: `--surface`
- Right border: 1px `--border-warm`
- Filter groups: Category (pill tag multi-select), Ships To (radio), Wholesale Price Range (dual input — min / max, INR-denominated, converted to display currency)
- Pill tags: selected state uses `--accent` background with White text; unselected uses `--muted-bg` with `--muted-text`
- Filter group headings: `label-sm` uppercase, `--muted-text`
- No heavy borders or shadows within sidebar

**Top bar**
- Search input (full-width on mobile, 400px on desktop): magnifier icon left, clear × right
- Sort dropdown right-aligned: "Best match" / "Newest" / "Price: low to high" / "Price: high to low"
- Results count: `caption`, `--muted-text` — "1,240 products"

**Product grid**
- 4 columns desktop, 3 tablet, 2 mobile (see §21.3.2)
- Product card spec as defined in §21.3.2
- Pagination at bottom: Previous / page numbers / Next — `label-sm` style, `--border-warm` bordered buttons

**Mobile filter**
- Sidebar hidden on mobile; replaced with "Filters" button (top bar) that opens a drawer from the bottom

#### 21.4.3 Product Detail Page (PDP)

**Top brand bar**
- Full-width strip, `--surface` background, 1px `--border-warm` bottom border
- Left: Brand logo circle (48px) + brand name (`label-md`) + achievement badge
- Right: "MOQ ₹4,200 minimum" pill (`label-sm`, `--muted-bg` background, `--border-warm` border)

**Two-column layout**
- Left column (sticky, 50% width on desktop): Photo grid — 2×2 arrangement for 4 photos; click to expand to full-screen lightbox. Photos are 1:1 square (Cloudinary auto-crop).
- Right column (scrollable, 50% width on desktop): All product information. On mobile: photos stack above info, both full-width.

**Right column contents (in order)**
1. Product name — `headline-md` Playfair Display
2. Wholesale price — `display-lg` Public Sans bold (large, prominent), formatted in buyer's display currency with INR equivalent in `caption` below
3. Tag pills row — `label-sm`, `--muted-bg` background (up to 5 visible, "+ N more" if overflow)
4. Short description — `body-md`, `--muted-text`
5. Variant selector — colour swatches (24px circles with `--border-warm` border; active state `--accent` border) or size pills (`label-sm` buttons)
6. Quantity stepper — minus / number input / plus, `--border-warm` border, minimum = MOQ
7. "Add to Cart" — Primary button, full-width, 48px height
8. Expandable sections (chevron toggle, `--border-warm` top border separator):
   - "Product Details" — weight, HS code, country of origin, lead time
   - "Shipping & Lead Time" — per-zone delivery windows
   - "Brand Story" — rich text, `body-lg`

#### 21.4.4 Brand Storefront Page

- Hero: Brand banner image (full-width, 320px height, Cloudinary auto-crop), brand logo overlaid bottom-left
- Brand header: name in `headline-lg` Playfair Display, location + year founded in `caption`, achievement badge, short description in `body-md`
- Collections tab bar (if brand has collections): horizontal pill tabs below header
- Product grid: same spec as Catalogue Page (§21.4.2) but filtered to this brand

#### 21.4.5 Brand Dashboard (Portal)

**Global layout**
- Fixed left sidebar: 280px wide, `--primary` (#1A1A1A) background, White icons and `label-md` labels
- Active nav item: `--accent` left border (3px), `--accent` text, `--surface` at 8% background tint
- Top bar: `--surface` background, 1px `--border-warm` bottom border — search input (left), notification bell + currency switcher + profile avatar (right)
- Content area: `--surface` (#FCFAFA) background, `4rem` padding desktop, `1.5rem` mobile
- Mobile: Sidebar collapses to bottom tab bar (5 items: Overview, Orders, Products, Share Links, Settings)

**Nav items:** Overview · Orders · Products · Share Links · Payouts · Analytics · Settings

**Overview — Stat cards**
- 4 cards in a row (2×2 on mobile): GMV this month / Orders / Avg Order Value / Commission Saved
- Each card: `--surface` background, 1px `--border-warm` border, `headline-md` number in `--primary`, `caption` label in `--muted-text`, small trend indicator (`↑ 12% vs last month` in `--success` or `--error`)

**Overview — Recent orders table**
- Columns: Order ID / Buyer name / Status badge / Amount (display currency) / Date
- Spec as per §21.3.9
- "View all orders" link beneath table

**Overview — Achievement progress**
- As per §21.3.8, placed below stat cards

**Orders tab**
- Full-width table with filter bar above (status tabs: All / Pending / Processing / Dispatched / Delivered / Disputed)
- Order detail slide-in panel on row click (right-side drawer, 480px)

**Analytics tab**
- Charts rendered with Recharts, consistent palette using design tokens
- All chart axes labelled, no chart without a title
- Customer geography: world map heatmap (SVG-based), top 5 countries listed below
- Time range selector: 30 days / 90 days / 12 months

#### 21.4.6 Buyer Dashboard

Same global layout principles as Brand Dashboard (§21.4.5) but sidebar background is `--surface` with `--border-warm` right border (lighter visual weight, reflecting the buyer's read-mostly relationship with the portal).

**Nav items:** Discover · Orders · Saved · Referrals · Wallet · Settings

**Discovery feed panel:** Personalised product grid using same product card spec (§21.3.2). "New from saved brands" alert strip — `--accent` background, White text, dismissible.

---

### 21.5 Design Rules — Prohibitions

The following are explicitly prohibited and must not appear anywhere in the codebase or in design artefacts:

- Saffron, turmeric orange, or any high-chroma warm accent (only `--accent` aged-brass #A68B67 is permitted)
- Rangoli patterns, paisley motifs, or Indian decorative patterns as UI elements
- Dense banner grids or rotating hero carousels on the homepage
- Festive animations or confetti effects (except on achievement unlock — single occurrence, tasteful)
- Pill-shaped buttons or circular badges for standard UI elements
- Box shadows heavier than `0 4px 20px rgba(26, 26, 26, 0.04)`
- Bright green, blue, or purple for status indicators (use the earthy semantic colours defined in §21.3.4)
- Horizontal scrolling at any viewport width
- Playfair Display for body copy, form labels, dashboard data, or navigation
- Public Sans for hero display headlines or brand name displays

---

### 21.6 Implementation Notes

**CSS architecture**
- All design tokens as CSS custom properties in `frontend/app/globals.css`
- Tailwind `@theme` configuration maps tokens to utility classes in `frontend/tailwind.config.ts`
- shadcn/ui components reskinned to use `--border-warm`, `--primary`, `--accent` tokens — override shadcn defaults at the component level, not via global CSS

**Font loading**
```tsx
// frontend/app/layout.tsx
import { Playfair_Display, Public_Sans } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-public-sans' });
```

**Cloudinary image transformations**
- Product photos: `c_fill,ar_1:1,q_auto,f_auto` (square crop, auto quality and format)
- Brand logos: `c_fill,ar_1:1,r_max,q_auto,f_auto` (circle crop for avatar use)
- Brand banners: `c_fill,ar_16:9,q_auto,f_auto` at 320px height

**Responsive breakpoints**

| Breakpoint | Width | Layout change |
|---|---|---|
| `sm` | 640px | — |
| `md` | 768px | Product grid: 4col → 3col; sidebar → drawer |
| `lg` | 1024px | Full sidebar appears; desktop layout activates |
| `xl` | 1280px | Full 12-column product grid |

**Charts:** Recharts library. Use `--accent` (#A68B67) as primary series colour. Use `--muted-text` (#444748) for axis labels and grid lines. Use `--border-warm` (#E5E1D8) for chart grid rules.

**Empty states:** Every empty panel must have an illustrated placeholder (thin line art, `--muted-text` stroke, no colour fill) and a primary CTA. Never leave a blank white panel.

**Motion:** Transitions should be at most 200ms ease-out for state changes (hover, focus, active). Page-level transitions: 300ms. Respect `prefers-reduced-motion` by disabling all non-essential animations.

---

*PRD v3.2 · Solomon Bharat · June 2026 · Confidential*
