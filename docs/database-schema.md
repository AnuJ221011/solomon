# Database Schema

> Last updated: June 2026 · PRD v3.1
> Prisma 7 — driver adapter (`@prisma/adapter-pg`) configured in `prisma.config.ts`. No `url` in datasource block.
> Schema file: `backend/prisma/schema.prisma`

## Overview

All prices and monetary values are stored in **INR** (`Decimal`). Currency conversion to the buyer's display currency happens at the application layer using cached FX rates from Redis.

## Entity Relationship Summary

```
User
 ├── BuyerProfile    (1:1)
 │    ├── SavedProduct[]
 │    └── SavedBrand[]
 ├── BrandProfile    (1:1)
 │    ├── Product[]
 │    │    ├── ProductPhoto[]
 │    │    ├── ProductVariant[]
 │    │    ├── ProductReview[]
 │    │    ├── CollectionProduct[]
 │    │    └── PromotedListing[]
 │    ├── ShippingRate[]         (one per zone)
 │    ├── ShareLink[]
 │    ├── Collection[]
 │    │    └── CollectionProduct[]
 │    ├── Promotion[]
 │    ├── PromotedListing[]
 │    ├── Order[]                (as seller)
 │    ├── Payout[]
 │    ├── CrmContact[]
 │    └── ShopifyStore?          (1:1)
 ├── Order[]                    (as buyer)
 │    ├── OrderItem[]
 │    ├── Return[]
 │    ├── ProductReview[]
 │    └── Message[]
 ├── BuyerReferral[]            (referrer)
 ├── Wallet (1:1)
 │    └── WalletCredit[]
 ├── Cart (1:1)
 │    └── CartItem[]
 ├── TeamMember[]               (memberships in others' accounts)
 ├── sentMessages Message[]
 └── receivedMessages Message[]

ShareLink
 ├── Order[]                    (attributed orders)
 └── UserShareLinkAttribution[]

FxRateSnapshot                  (audit log — live rates in Redis)
```

---

## Tables

### User
Primary identity record. One user is a BUYER, BRAND, or ADMIN.

| Column | Type | Notes |
|---|---|---|
| `id` | CUID | PK |
| `email` | String | Unique |
| `passwordHash` | String? | `null` if Google-only (Phase 2) |
| `name` | String | Display name |
| `googleId` | String? | Unique; reserved for Phase 2 |
| `avatarUrl` | String? | |
| `role` | Enum | `BUYER \| BRAND \| ADMIN` |
| `isEmailVerified` | Boolean | Must be `true` to place orders |
| `isActive` | Boolean | `false` = suspended |

---

### BuyerProfile
Extended buyer data. Created with `User` on signup.

| Column | Type | Notes |
|---|---|---|
| `businessName` | String | Shown on orders to brands |
| `countryCode` | String | ISO 3166-1 alpha-2 |
| `phone` | String? | Required before first order |
| `preferredCurrency` | String | Default `USD` |
| `storeType` | String? | From store type quiz: `boutique \| gift_shop \| subscription_box \| online_store \| pop_up \| other` |
| `aesthetic` | String? | From quiz: `minimalist \| bohemian \| artisan \| luxury \| contemporary \| eclectic` |
| `categoryInterests` | String[] | From quiz: product categories of interest |
| `businessVerified` | Boolean | Auto-set after first dispatched order |
| `businessVerifiedAt` | DateTime? | Timestamp of verification |

---

### BrandProfile
Extended brand data. Created with `User` on signup. Admin approval required before going live.

| Column | Type | Notes |
|---|---|---|
| `brandName` | String | |
| `slug` | String | Unique URL slug |
| `category` | String[] | Up to 2 categories |
| `countryOfOrigin` | String | Default `IN` |
| `gstNumber` | String? | Indian GST number |
| `businessRegNumber` | String? | Alternative business registration |
| `description` | String? | Short brand description |
| `brandStory` | String? | Founding story (up to 1000 chars) |
| `instagramHandle` | String? | |
| `websiteUrl` | String? | |
| `yearFounded` | Int? | |
| `socialLinks` | Json? | `{ instagram, facebook, twitter, pinterest }` |
| `existingRetailPartners` | String? | Text description |
| `pickupPincode` | String? | Used for Shiprocket rate calculation |
| `logoUrl` | String? | Cloudinary URL |
| `bannerUrl` | String? | Cloudinary URL |
| `status` | Enum | `PENDING \| APPROVED \| REJECTED \| SUSPENDED` |
| `achievementLevel` | Enum | `L1_SPROUT` through `L5_LEGEND` |
| `isAdminOverride` | Boolean | Skips auto recalculation |
| `confirmedOrderCount` | Int | Denormalised — incremented on each confirmed order |
| `avgRating` | Float | Recalculated on every review |
| `totalGmvInr` | Decimal | Running GMV total |
| `avgDispatchDays` | Float | Rolling average days from order creation to dispatch |
| `payoutSpeed` | Enum | `NET_30` (default, free) or `EXPRESS` (next day, 2.5% fee) |
| `approvedAt` | DateTime? | Set by admin on approval |

---

### Product

| Column | Type | Notes |
|---|---|---|
| `name` | VarChar(80) | |
| `slug` | String | Unique |
| `shortDescription` | VarChar(160) | Feed card text |
| `fullDescription` | String? | Rich text for detail page |
| `wholesalePriceInr` | Decimal | Stored in INR |
| `moq` | Int | Minimum order quantity |
| `leadTime` | Enum | `ONE_TO_THREE_DAYS \| ONE_TO_TWO_WEEKS \| TWO_TO_FOUR_WEEKS` |
| `weightGrams` | Int | For per-kg shipping and Shiprocket |
| `hsTariffCode` | String? | For import duty clarity |
| `countryOfOrigin` | String | Default `IN` |
| `categories` | String[] | Up to 2 |
| `tags` | String[] | Up to 10; pg_trgm indexed |
| `availability` | Enum | `ACTIVE \| INACTIVE \| COMING_SOON` |
| `enabledZones` | ShippingZone[] | Zones brand ships to |
| `viewCount` | Int | Incremented on product page views |
| `orderCount` | Int | Incremented on each ordered unit |

---

### ProductVariant
Optional variants per product (size, colour, material, etc.).

| Column | Type | Notes |
|---|---|---|
| `sku` | String | Unique across platform |
| `priceInr` | Decimal | Variant-specific price |
| `stock` | Int | Available units |
| `imageUrl` | String? | Optional variant-specific image |
| `status` | Enum | `ACTIVE \| INACTIVE \| OUT_OF_STOCK` |

---

### ProductPhoto
Ordered product images. Uploaded to Cloudinary.

| Column | Type | Notes |
|---|---|---|
| `productId` | String | FK → Product |
| `url` | String | Cloudinary / picsum URL |
| `publicId` | String | Cloudinary public ID |
| `position` | Int | Display order (0-indexed) |

---

### Category
Hierarchical product categories with self-referential parent.

| Column | Type | Notes |
|---|---|---|
| `name` | String | Unique |
| `slug` | String | Unique URL slug |
| `description` | String? | |
| `parentId` | String? | Self-referential for subcategories |
| `sortOrder` | Int | Display order |
| `isActive` | Boolean | |

---

### Cart / CartItem
Server-side cart. One cart per buyer user.

| Column | Type | Notes |
|---|---|---|
| `Cart.userId` | String | Unique — one cart per user |
| `CartItem.productId` | String | |
| `CartItem.quantity` | Int | Enforces MOQ at upsert time |
| `CartItem.variantId` | String? | FK → ProductVariant (nullable) |
| `CartItem.variantLabel` | String? | Snapshot of variant label at add-to-cart time |

---

### ShippingRate
One record per brand per shipping zone.

| Column | Type | Notes |
|---|---|---|
| `zone` | Enum | Unique per brand |
| `rateType` | Enum | `FLAT \| PER_KG` |
| `flatRateInr` | Decimal? | For FLAT rate type |
| `perKgRateInr` | Decimal? | For PER_KG rate type |
| `freeShippingAboveInr` | Decimal? | Optional free threshold |

---

### Order

| Column | Type | Notes |
|---|---|---|
| `status` | Enum | `PENDING → CONFIRMED → PROCESSING → DISPATCHED → DELIVERED \| CANCELLED \| DISPUTED` |
| `subtotalInr` | Decimal | Sum of all items |
| `shippingCostInr` | Decimal | Per-brand shipping cost |
| `commissionRate` | Decimal | Rate applied (e.g. `0.1500`). `0` for share link and manual orders. |
| `commissionInr` | Decimal | `subtotalInr × commissionRate` |
| `totalInr` | Decimal | `subtotalInr + shippingCostInr` |
| `buyerCurrency` | String | Display currency at checkout |
| `totalBuyerCurrency` | Decimal | Total in buyer's currency |
| `fxRateUsed` | Decimal | FX rate at checkout (audit trail) |
| `shippingZone` | Enum | Zone used for this order |
| `isOpeningOrder` | Boolean | `true` if buyer's first order from this brand |
| `isManualOrder` | Boolean | `true` for invoicing tab orders |
| `trackingNumber` | String? | Set when brand dispatches |
| `trackingCarrier` | String? | Carrier name |
| `paypalOrderId` | String? | PayPal order reference |
| `paypalCaptureId` | String? | PayPal capture reference |
| `shareLinkId` | String? | Attribution if buyer came via Share Link |
| `dispatchedAt` | DateTime? | |
| `deliveredAt` | DateTime? | |

---

### Return

| Column | Type | Notes |
|---|---|---|
| `orderId` | String | The order being returned |
| `requestedById` | String | Buyer's user ID |
| `reason` | String | |
| `photoUrls` | String[] | Damage photo URLs |
| `status` | Enum | `REQUESTED → APPROVED → LABEL_ISSUED → RECEIVED → REFUNDED \| REJECTED` |
| `isOpeningOrder` | Boolean | Platform absorbs cost if `true` |
| `adminNotes` | String? | |
| `returnLabelUrl` | String? | Prepaid label URL |
| `resolvedAt` | DateTime? | Set when REFUNDED or REJECTED |

---

### ProductReview

| Column | Type | Notes |
|---|---|---|
| `productId` | String | |
| `orderId` | String | |
| `reviewerUserId` | String | |
| `rating` | Int | 1–5 |
| `comment` | String? | |
| `brandResponse` | String? | Brand's public reply |
| Unique constraint | `orderId + productId` | One review per product per order |

---

### Collection / CollectionProduct
Brand-curated product groups shown on the storefront.

| Column | Type | Notes |
|---|---|---|
| `Collection.name` | String | |
| `Collection.isActive` | Boolean | |
| `CollectionProduct.position` | Int | Display order |
| Unique | `collectionId + productId` | No duplicate products |

---

### Promotion
Time-boxed percentage discount on catalogue or collection.

| Column | Type | Notes |
|---|---|---|
| `discountPercent` | Int | 1–90 |
| `scope` | Enum | `CATALOG \| COLLECTION` |
| `collectionId` | String? | Required if scope = COLLECTION |
| `startsAt` | DateTime | |
| `endsAt` | DateTime? | |
| `isActive` | Boolean | |

---

### PromotedListing
Paid visibility boost in the discovery feed.

| Column | Type | Notes |
|---|---|---|
| `productId` | String | |
| `brandProfileId` | String | |
| `bidAmountInr` | Decimal | Minimum ₹100. Higher bid = more ranking boost. |
| `startsAt` | DateTime | |
| `endsAt` | DateTime? | |
| `isActive` | Boolean | Set by admin |
| `impressions` | Int | Auto-incremented on product feed load |
| `clicks` | Int | For future CTR tracking |

---

### ShareLink

| Column | Type | Notes |
|---|---|---|
| `token` | CUID | Unique; used in URL |
| `slug` | String? | Optional vanity slug |
| `target` | Enum | `PRODUCT \| COLLECTION \| STOREFRONT` |
| `password` | String? | bcrypt-hashed; enforced on resolve |
| `lockedCurrency` | String? | Forces display currency |
| `expiresAt` | DateTime? | Auto-deactivates |
| `viewCount` | Int | Total views |
| `uniqueVisitors` | Int | |
| `signupCount` | Int | New users via this link |
| `orderCount` | Int | Orders attributed to this link |
| `revenueInr` | Decimal | Revenue attributed |
| `commissionSavedInr` | Decimal | Commission saved vs standard rate |

---

### BuyerReferral

| Column | Type | Notes |
|---|---|---|
| `referrerUserId` | String | Buyer who referred |
| `referredBrandId` | String? | Brand that signed up |
| `token` | CUID | Unique referral token |
| `rewardIssued` | Boolean | ₹500 credit after brand's first dispatched order |
| `bonusIssued` | Boolean | ₹500 bonus if brand reaches L2 within 90 days |

---

### Wallet / WalletCredit

| Column | Type | Notes |
|---|---|---|
| `Wallet.balanceInr` | Decimal | Sum of active credits |
| `WalletCredit.amountInr` | Decimal | |
| `WalletCredit.status` | Enum | `PENDING \| ACTIVE \| USED \| EXPIRED` |
| `WalletCredit.reason` | String | Human-readable reason for issuance |
| `WalletCredit.expiresAt` | DateTime | 12-month TTL |

---

### Payout

| Column | Type | Notes |
|---|---|---|
| `orderId` | String | Unique — one payout per order |
| `grossInr` | Decimal | `order.totalInr` |
| `commissionInr` | Decimal | |
| `processingFeeInr` | Decimal | 2.5% of gross for EXPRESS payout, 0 for NET_30 |
| `netInr` | Decimal | `gross - commission - processingFee` |
| `payoutSpeed` | Enum | `NET_30 \| EXPRESS` |
| `isPaid` | Boolean | |
| `scheduledAt` | DateTime? | 30 days post-dispatch for NET_30 |
| `paidAt` | DateTime? | Set by admin on payment |
| `paypalBatchId` | String? | PayPal batch payout ID |

---

### Message
In-platform messages between buyers and brands.

| Column | Type | Notes |
|---|---|---|
| `orderId` | String? | Optional — ties message to an order thread |
| `senderId` | String | |
| `recipientId` | String | |
| `content` | String | Up to 2000 chars |
| `isRead` | Boolean | |

---

### TeamMember

| Column | Type | Notes |
|---|---|---|
| `userId` | String | The invited team member |
| `ownerUserId` | String | Account owner (brand or buyer) |
| `role` | Enum | `ADMIN \| CUSTOM` |
| `canViewPayouts` | Boolean | |
| `canViewAnalytics` | Boolean | |
| Unique | `userId + ownerUserId` | |

---

### CrmContact
Brand's off-platform wholesale contact list.

| Column | Type | Notes |
|---|---|---|
| `brandProfileId` | String | |
| `email` | String | Unique per brand |
| `name` | String? | |
| `businessName` | String? | |
| `notes` | String? | |
| Unique | `brandProfileId + email` | |

---

### ShopifyStore
Brand's connected Shopify private app.

| Column | Type | Notes |
|---|---|---|
| `brandProfileId` | String | Unique — one store per brand |
| `shopDomain` | String | Unique e.g. `mybrand.myshopify.com` |
| `accessToken` | String | Private app access token (never returned in API responses) |
| `isActive` | Boolean | |
| `lastSyncAt` | DateTime? | Updated after each product import |

---

### FxRateSnapshot
Audit log of every FX rate fetch. Live rates are in Redis at `fx:rates`.

---

## Enums Reference

```
Role:                 BUYER | BRAND | ADMIN
BrandStatus:          PENDING | APPROVED | REJECTED | SUSPENDED
AchievementLevel:     L1_SPROUT | L2_RISING | L3_TRUSTED | L4_ELITE | L5_LEGEND
ProductAvailability:  ACTIVE | INACTIVE | COMING_SOON
LeadTime:             ONE_TO_THREE_DAYS | ONE_TO_TWO_WEEKS | TWO_TO_FOUR_WEEKS
OrderStatus:          PENDING | CONFIRMED | PROCESSING | DISPATCHED | DELIVERED | CANCELLED | DISPUTED
ShippingZone:         DOMESTIC | SOUTH_ASIA | SOUTHEAST_ASIA | MIDDLE_EAST | EUROPE | NORTH_AMERICA | OCEANIA | REST_OF_WORLD
ShippingRateType:     FLAT | PER_KG
CreditStatus:         PENDING | ACTIVE | USED | EXPIRED
ShareLinkTarget:      PRODUCT | COLLECTION | STOREFRONT
PayoutSpeed:          NET_30 | EXPRESS
ReturnStatus:         REQUESTED | APPROVED | REJECTED | LABEL_ISSUED | RECEIVED | REFUNDED
TeamRole:             ADMIN | CUSTOM
PromotionScope:       CATALOG | COLLECTION
```

---

## Indexes

All foreign keys are indexed. Additional indexes:

| Table | Column(s) | Type | Purpose |
|---|---|---|---|
| User | email | B-tree | Auth lookup |
| BrandProfile | slug | B-tree | Storefront URL |
| BrandProfile | status | B-tree | Admin filtering |
| BrandProfile | achievementLevel | B-tree | Feed ranking |
| Product | brandProfileId, availability | B-tree | Brand listing queries |
| Product | name (trgm) | GIN | Fuzzy search *(manual SQL)* |
| Product | shortDescription (trgm) | GIN | Fuzzy search *(manual SQL)* |
| ShareLink | token | B-tree | Link resolution |
| Order | status | B-tree | Pipeline queries |
| Order | shareLinkId | B-tree | Attribution queries |
| Message | senderId, recipientId | B-tree | Conversation lookup |
| PromotedListing | isActive | B-tree | Feed ranking query |
| CrmContact | brandProfileId | B-tree | Contact list query |

> pg_trgm GIN indexes must be created manually — see [project-setup.md](project-setup.md#4-pgtrgm-extension).
