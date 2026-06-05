# API Reference

> Last updated: June 2026 · PRD v3.0 · All features complete
> Base URL: `http://localhost:5000/api`

## Response Envelope

```json
// Success
{ "success": true, "message": "...", "data": { ... } }

// Error
{ "success": false, "message": "...", "errors": [{ "field": "email", "message": "..." }] }
```

## Authentication

Protected routes require:
```
Authorization: Bearer <accessToken>
```
Refresh tokens are stored in an `httpOnly` cookie named `refreshToken`.

**Auth levels used in this document:**
- `—` = public, no token needed
- `JWT` = any valid access token
- `BUYER` = authenticated user with `role: BUYER`
- `BUYER (verified)` = BUYER with `isEmailVerified: true`
- `BRAND` = authenticated user with `role: BRAND`
- `ADMIN` = authenticated user with `role: ADMIN`

---

## Auth — `/api/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/buyer/signup` | — | Register buyer account |
| POST | `/brand/signup` | — | Register brand account (enters pending state) |
| POST | `/login` | — | Email + password login |
| POST | `/logout` | — | Invalidate refresh token cookie |
| POST | `/refresh` | Cookie | Rotate refresh token, get new access token |
| POST | `/verify-email` | — | Confirm 6-digit OTP |
| POST | `/resend-otp` | — | Resend OTP to email |
| POST | `/forgot-password` | — | Request password reset OTP |
| POST | `/reset-password` | — | Reset password with OTP |
| POST | `/store-quiz` | BUYER | Save store type quiz answers (can be done post-signup) |
| GET | `/me` | JWT | Get current authenticated user |

> **Google OAuth** deferred to Phase 2. Email + password is the only auth method in the current build.

### POST `/buyer/signup`
```json
{
  "email": "buyer@example.com",
  "password": "Secret1234",
  "businessName": "Little Boutique NYC",
  "countryCode": "US",
  "phone": "+12125551234",
  "storeType": "boutique",
  "aesthetic": "artisan",
  "categoryInterests": ["textiles", "jewellery"],
  "shareLinkToken": "abc123",
  "referralToken": "xyz789"
}
```
> `storeType`, `aesthetic`, `categoryInterests`, `phone`, `shareLinkToken`, `referralToken` are all optional.

### POST `/brand/signup`
```json
{
  "email": "brand@example.com",
  "password": "Secret1234",
  "brandName": "Silk Route Co",
  "category": ["Textiles"],
  "countryOfOrigin": "IN",
  "gstNumber": "22AAAAA0000A1Z5",
  "instagramHandle": "silkrouteco",
  "websiteUrl": "https://silkrouteco.com",
  "yearFounded": 2018,
  "brandStory": "Started in Varanasi by two weavers...",
  "existingRetailPartners": "Urban Outfitters UK, Small Boutique Paris",
  "referralToken": "xyz789"
}
```
> Either `gstNumber` or `businessRegNumber` is required.

### POST `/auth/store-quiz`
```json
{
  "storeType": "boutique",
  "aesthetic": "artisan",
  "categoryInterests": ["textiles", "home_decor"]
}
```

---

## Brands — `/api/brands`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | — | List approved brands (paginated, filterable by category, level, search) |
| GET | `/:slug` | — | Brand storefront with products, collections, active promotions |
| GET | `/me/profile` | BRAND | Own brand profile including shipping rates and collections |
| PATCH | `/me/profile` | BRAND | Update brand profile (all fields incl. `pickupPincode`, `payoutSpeed`) |
| GET | `/me/dashboard` | BRAND | GMV trend, orders, share link stats, pending payouts |
| GET | `/me/payouts/export` | BRAND | Download own payout history as CSV (`?isPaid=false\|true`) |

---

## Products — `/api/products`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | — (optional JWT for ranking) | Ranked discovery feed — personalised if authenticated |
| GET | `/:slug` | — | Product detail page |
| GET | `/me/listings` | BRAND | Brand's own listings |
| POST | `/` | BRAND | Create product |
| PATCH | `/:id` | BRAND | Update product |
| DELETE | `/:id` | BRAND | Delete product |
| POST | `/bulk-import` | BRAND | Import products from CSV file (`multipart/form-data`, field: `file`) |

### Discovery feed query params (`GET /`)
| Param | Type | Default | Description |
|---|---|---|---|
| `sortBy` | string | `rank` | `rank` (personalised score) \| `createdAt` \| `wholesalePriceInr` \| `name` |
| `search` | string | — | Fuzzy search on name, description, tags |
| `category` | string | — | Filter by category name |
| `zone` | string | — | Filter by shipping zone |
| `minPrice` / `maxPrice` | number | — | INR price range |
| `page` / `limit` | number | 1 / 20 | Pagination |

### CSV bulk import format
Required columns: `name`, `short_description`, `wholesale_price_inr`, `moq`, `weight_grams`, `lead_time`, `shipping_zones`
Optional: `full_description`, `msrp_inr`, `hs_tariff_code`, `country_of_origin`, `categories`, `tags`

- `lead_time` values: `one_to_three_days` | `one_to_two_weeks` | `two_to_four_weeks`
- `shipping_zones` / `categories` / `tags`: pipe-separated (`EUROPE|NORTH_AMERICA`)

---

## Photos — `/api/photos`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/product/:productId` | BRAND | Upload up to 8 product photos (`multipart`, field: `photos`) |
| PATCH | `/product/:productId/reorder` | BRAND | Reorder photos `[{ id, position }]` |
| DELETE | `/product/:productId/photo/:photoId` | BRAND | Delete a product photo from Cloudinary + DB |
| POST | `/brand/logo` | BRAND | Upload brand logo (`multipart`, field: `logo`) |
| POST | `/brand/banner` | BRAND | Upload brand banner (`multipart`, field: `banner`) |

---

## Orders — `/api/orders`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/checkout` | BUYER (verified) | Convert cart → one order per brand. Requires prior PayPal capture. |
| GET | `/my` | BUYER | Buyer's order history (filterable by `status`) |
| GET | `/brand` | BRAND | Brand's incoming orders (filter: `status`, `isManualOrder`, `shareLinkId`, date range) |
| POST | `/brand/manual` | BRAND | Create off-platform manual order — 0% commission |
| PATCH | `/brand/:id/status` | BRAND | Update order status + tracking info |
| GET | `/:id` | JWT | Get single order (buyer sees own; brand sees theirs) |

### POST `/checkout`
```json
{
  "shippingAddress": {
    "line1": "123 Main St", "line2": "Apt 4B",
    "city": "New York", "state": "NY",
    "postalCode": "10001", "countryCode": "US"
  },
  "paypalOrderId": "PAYPAL-ORDER-ID-HERE",
  "walletCreditsToApplyInr": 500
}
```

### PATCH `/brand/:id/status`
```json
{
  "status": "DISPATCHED",
  "trackingNumber": "1Z999AA10123456784",
  "trackingCarrier": "UPS"
}
```

**Status transitions:** `PENDING → CONFIRMED → PROCESSING → DISPATCHED → DELIVERED`
Triggering `CONFIRMED` fires achievement recalculation. `DISPATCHED` fires referral reward, avgDispatchDays update, buyer verification, Shopify push, and dispatch email.

### POST `/brand/manual`
```json
{
  "buyerEmail": "wholesale@example.com",
  "buyerName": "Jane Smith",
  "buyerBusinessName": "Little Boutique Paris",
  "countryCode": "FR",
  "shippingAddress": { "line1": "...", "city": "Paris", "postalCode": "75001", "countryCode": "FR" },
  "items": [{ "productId": "cuid...", "quantity": 10 }],
  "notes": "Via trade show - Sheffield 2026"
}
```

---

## Payments — `/api/payments`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/paypal/cart-total` | BUYER (verified) | Pre-checkout total: `{ grandTotalInr, grandTotalBuyerCurrency, currency, availableCreditsInr, brandBreakdowns }` |
| POST | `/paypal/create-order` | BUYER (verified) | Create PayPal order → returns `{ paypalOrderId, approvalUrl, chargeableTotalBuyerCurrency }` |
| POST | `/paypal/capture` | BUYER (verified) | Capture approved PayPal payment + create platform orders |
| POST | `/paypal/webhook` | — | PayPal webhook (raw body required) |

### Checkout flow
1. `GET /paypal/cart-total?countryCode=US` — show buyer the total
2. `POST /paypal/create-order` — create PayPal order, get approval URL
3. Redirect buyer to PayPal `approvalUrl`
4. After approval, `POST /paypal/capture` — captures payment and creates all platform orders

### POST `/paypal/create-order`
```json
{ "countryCode": "US", "walletCreditsToApplyInr": 500 }
```

### POST `/paypal/capture`
```json
{
  "paypalOrderId": "PAYPAL-ORDER-ID",
  "shippingAddress": { "line1": "123 Main St", "city": "New York", "postalCode": "10001", "countryCode": "US" },
  "walletCreditsToApplyInr": 500
}
```

---

## Returns — `/api/returns`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/order/:orderId` | BUYER | Request return (order must be `DELIVERED`). Notifies brand by email. |
| GET | `/` | ADMIN | List all returns (filter: `status`, `orderId`, date range) |
| PATCH | `/:id/status` | ADMIN | Update return status. Notifies buyer by email. |

### POST `/order/:orderId`
```json
{ "reason": "Items damaged in transit", "photoUrls": ["https://..."] }
```

### PATCH `/:id/status`
```json
{ "status": "APPROVED", "adminNotes": "Return approved — brand has been notified", "returnLabelUrl": "https://..." }
```
Status flow: `REQUESTED → APPROVED → LABEL_ISSUED → RECEIVED → REFUNDED | REJECTED`

---

## Reviews — `/api/reviews`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/product/:productId` | — | List product reviews (paginated) |
| POST | `/` | BUYER | Submit review (order must be `DELIVERED`) |
| PATCH | `/:id` | BUYER | Edit own review (rating or comment) |
| POST | `/:id/respond` | BRAND | Brand's public response to a review |

### POST `/`
```json
{ "orderId": "cuid...", "productId": "cuid...", "rating": 5, "comment": "Beautiful craftsmanship." }
```

---

## Buyer — `/api/buyer`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/dashboard` | BUYER | Profile, wallet balance, active credits, recent orders, referral stats |
| GET | `/cart` | BUYER | Current cart grouped by brand |
| PUT | `/cart/item` | BUYER (verified) | Add/update cart item — enforces MOQ |
| DELETE | `/cart/item/:productId` | BUYER (verified) | Remove item from cart |
| DELETE | `/cart` | BUYER (verified) | Clear entire cart |
| GET | `/saved` | BUYER | Saved products and saved brands |
| POST | `/saved/product/:productId` | BUYER (verified) | Save a product |
| DELETE | `/saved/product/:productId` | BUYER | Unsave a product |
| POST | `/saved/brand/:brandProfileId` | BUYER (verified) | Save a brand |
| DELETE | `/saved/brand/:brandProfileId` | BUYER | Unsave a brand |

### PUT `/cart/item`
```json
{ "productId": "cuid...", "quantity": 12, "variantOptions": { "color": "red", "size": "M" } }
```

---

## Share Links — `/api/share-links`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/:token` | — | Resolve share link. Append `?password=secret` for password-protected links. |
| POST | `/visit` | — | Record a page view `{ token, isUnique }` |
| GET | `/` | BRAND | List own share links with analytics (views, signups, orders, revenue, commissionSaved) |
| POST | `/` | BRAND | Create share link |
| PATCH | `/:id` | BRAND | Update share link (deactivate, change expiry, etc.) |
| DELETE | `/:id` | BRAND | Delete share link |

### POST `/` — Create share link
```json
{
  "target": "STOREFRONT",
  "slug": "uk-buyers-summer",
  "customMessage": "Exclusive wholesale access for our retail partners",
  "password": "secretpass",
  "lockedCurrency": "GBP",
  "expiresAt": "2026-12-31T23:59:59Z"
}
```
> `target` must be one of `PRODUCT`, `COLLECTION`, `STOREFRONT`. Include `productId` or `collectionId` accordingly.

---

## Collections — `/api/collections`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | BRAND | List own collections with products |
| POST | `/` | BRAND | Create collection |
| PATCH | `/:id` | BRAND | Update name, description, or `isActive` |
| DELETE | `/:id` | BRAND | Delete collection |
| POST | `/:id/products` | BRAND | Add product to collection `{ productId, position }` |
| DELETE | `/:id/products/:productId` | BRAND | Remove product from collection |

---

## Promotions — `/api/promotions`

Discount promotions on brand's catalogue or a specific collection.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | BRAND | List own promotions |
| POST | `/` | BRAND | Create promotion |
| PATCH | `/:id` | BRAND | Update or toggle `isActive` |
| DELETE | `/:id` | BRAND | Delete promotion |

### POST `/`
```json
{
  "name": "Summer Sale",
  "discountPercent": 15,
  "scope": "CATALOG",
  "startsAt": "2026-07-01T00:00:00Z",
  "endsAt": "2026-07-31T23:59:59Z"
}
```
> `scope` is `CATALOG` or `COLLECTION`. If `COLLECTION`, include `collectionId`.

---

## Promoted Listings — `/api/promoted`

Paid visibility boost in the discovery feed. Brand bids → admin activates.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/` | BRAND | Submit a promoted listing bid |
| GET | `/` | BRAND | List own promoted listings |
| DELETE | `/:id` | BRAND | Cancel a promoted listing |
| POST | `/:id/activate` | ADMIN | Activate a submitted bid |
| POST | `/:id/deactivate` | ADMIN | Deactivate an active promotion |
| GET | `/admin/active` | ADMIN | List all active promoted listings |

### POST `/`
```json
{
  "productId": "cuid...",
  "bidAmountInr": 2500,
  "startsAt": "2026-07-01T00:00:00Z",
  "endsAt": "2026-07-31T23:59:59Z"
}
```
> Minimum bid: ₹100. Higher bids receive proportionally more ranking boost (max +5 on top of base +10).

---

## Team — `/api/team`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | List team members for own account |
| POST | `/` | JWT | Invite team member by email |
| DELETE | `/:userId` | JWT | Remove team member |

### POST `/`
```json
{
  "email": "colleague@example.com",
  "role": "CUSTOM",
  "canViewPayouts": false,
  "canViewAnalytics": true
}
```
> `role` is `ADMIN` (full access) or `CUSTOM` (restricted). Invited user must already have a Solomon Bharat account.

---

## Messenger — `/api/messages`

In-platform messaging between buyers and brands. Optionally tied to a specific order.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/conversations` | JWT | List all conversation partners with last message + unread count |
| GET | `/:partnerId` | JWT | Full message thread with a specific user (filter: `?orderId=`, `?page=`, `?limit=`) |
| POST | `/` | JWT | Send a message |
| PATCH | `/:id/read` | JWT | Mark a single message as read |

### POST `/`
```json
{
  "recipientId": "cuid...",
  "content": "Hi, can you ship this in custom packaging?",
  "orderId": "cuid..."
}
```
> `orderId` is optional but recommended — ties the message to the order context.

---

## Achievements — `/api/achievements`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/progress` | BRAND | Current level, stats vs criteria, next level preview |
| GET | `/social-card` | BRAND | Social card data for sharing level achievement |

### GET `/social-card` response
```json
{
  "brandName": "Silk Route Co",
  "level": "L3_TRUSTED",
  "levelName": "Trusted",
  "levelNumber": 3,
  "commissionRate": "14%",
  "stats": { "confirmedOrders": 27, "avgRating": 4.6 },
  "shareUrl": "https://solomonbharat.com/brands/silk-route-co",
  "cardImageUrl": "https://solomonbharat.com/api/og/achievement?brand=silk-route-co&level=L3_TRUSTED",
  "message": "Silk Route Co has reached Trusted level on Solomon Bharat! 🎉"
}
```

---

## Referrals — `/api/referrals`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/link` | BUYER | Personal referral link `{ referralLink: "/signup?ref=<token>" }` |
| GET | `/wallet` | BUYER | Wallet balance + active credit history |
| GET | `/leaderboard` | BUYER | Top 20 referrers this month + buyer's rank and percentile |

### GET `/leaderboard` response
```json
{
  "leaderboard": [
    { "rank": 1, "name": "Jane S.", "referrals": 12 },
    { "rank": 2, "name": "Tom K.", "referrals": 8 }
  ],
  "myStats": {
    "rank": 14,
    "referrals": 3,
    "percentile": 94,
    "summary": "You've referred 3 brands — top 6% of buyers this month"
  }
}
```

---

## CRM / Email Tools — `/api/crm`

Brand's contact list management and share link campaign sending.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/contacts` | BRAND | List CRM contacts |
| POST | `/contacts` | BRAND | Add a single contact |
| DELETE | `/contacts/:id` | BRAND | Delete a contact |
| POST | `/contacts/import` | BRAND | Import contacts from CSV (`multipart`, field: `file`) |
| POST | `/campaigns/send-share-link` | BRAND | Send share link campaign to contacts via email |

### POST `/contacts`
```json
{ "email": "buyer@boutique.com", "name": "Sophie Martin", "businessName": "Boutique Lumière" }
```

### CRM contact CSV columns
`name`, `email`, `business_name`, `notes` — `email` is required; all others optional.

### POST `/campaigns/send-share-link`
```json
{
  "shareLinkId": "cuid...",
  "subject": "New Summer Collection — Exclusive Wholesale Access",
  "message": "Hi, we've just launched our summer collection. Click below to browse and place orders at wholesale prices.",
  "contactIds": ["cuid1", "cuid2"]
}
```
> Omit `contactIds` to send to all contacts.

---

## Shopify Integration — `/api/shopify`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/store` | BRAND | Get connected Shopify store info (access token is never returned) |
| POST | `/store/connect` | BRAND | Connect a Shopify store via private app credentials |
| DELETE | `/store/disconnect` | BRAND | Disconnect the Shopify store |
| POST | `/import-products` | BRAND | Import products from the connected Shopify store |
| POST | `/webhook` | — | Receive Shopify webhook events (`products/update`, `inventory_levels/update`) |

### POST `/store/connect`
```json
{
  "shopDomain": "mybrand.myshopify.com",
  "accessToken": "shppa_..."
}
```
> Get the access token from your Shopify Admin → Apps → Develop apps → private app.

### POST `/webhook` headers (sent by Shopify)
```
X-Shopify-Topic: products/update
X-Shopify-Shop-Domain: mybrand.myshopify.com
```

---

## FX Rates — `/api/fx`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/rates` | — | Current FX rates (INR base) `{ rates: { USD, GBP, EUR, AUD, CAD, SGD, AED, INR } }` |

---

## Geo-detect — `/api/geo`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/detect` | — | Detect visitor's country + suggested currency from IP `{ countryCode, currency, source }` |

`source` is `ipapi` (real detection), `fallback` (API error), or `default` (local/private IP).

---

## Shipping — `/api/shipping`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | BRAND | Brand's configured shipping rates |
| PUT | `/zone` | BRAND | Create or update a zone rate |

### PUT `/zone`
```json
{
  "zone": "EUROPE",
  "rateType": "FLAT",
  "flatRateInr": 850,
  "freeShippingAboveInr": 15000
}
```
> `rateType` is `FLAT` (requires `flatRateInr`) or `PER_KG` (requires `perKgRateInr`).

---

## Admin — `/api/admin`

All routes require `ADMIN` role.

### Brand management

| Method | Path | Description |
|---|---|---|
| GET | `/stats` | Platform stats: total brands, buyers, orders, GMV, pending payout INR |
| GET | `/brands/pending` | Brands awaiting approval (ordered oldest first) |
| POST | `/brands/:id/approve` | Approve brand — sends approval email |
| POST | `/brands/:id/reject` | Reject brand |
| POST | `/brands/:id/level` | Override achievement level `{ "level": "L3_TRUSTED" }` |

### User management

| Method | Path | Description |
|---|---|---|
| POST | `/users/:id/suspend` | Suspend a user (sets `isActive: false`) |
| POST | `/users/:id/reactivate` | Reactivate a suspended user |

### Payout management

| Method | Path | Description |
|---|---|---|
| GET | `/payouts` | List payouts (filter: `isPaid`, `brandId`, `dateFrom`, `dateTo`) |
| GET | `/payouts/export` | Download payouts as CSV (`?isPaid=false\|true`) |
| POST | `/payouts/:id/mark-paid` | Mark single payout paid `{ "paypalBatchId": "..." }` |
| POST | `/payouts/bulk-paid` | Batch mark paid `{ "payoutIds": [...], "paypalBatchId": "..." }` |

---

## Rate Limits

| Limiter | Window | Max requests | Applied to |
|---|---|---|---|
| Global | 15 min | 200 | All `/api` routes |
| Auth | 15 min | 20 | Signup, login, forgot password |
| OTP | 1 hour | 5 | Verify email, resend OTP |

---

## HTTP Status Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad request / invalid state |
| 401 | Unauthenticated (no or invalid token) |
| 403 | Forbidden (wrong role, unverified email, or wrong share link password) |
| 404 | Not found |
| 409 | Conflict (duplicate record) |
| 410 | Gone (expired OTP, expired share link) |
| 422 | Validation failed (Zod — includes field-level `errors` array) |
| 429 | Rate limited or OTP locked out |
| 500 | Internal server error |
