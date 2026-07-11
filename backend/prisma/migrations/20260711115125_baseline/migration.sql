-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."AchievementLevel" AS ENUM ('L1_SPROUT', 'L2_RISING', 'L3_TRUSTED', 'L4_ELITE', 'L5_LEGEND');

-- CreateEnum
CREATE TYPE "public"."BankAccountType" AS ENUM ('SAVINGS', 'CURRENT');

-- CreateEnum
CREATE TYPE "public"."BrandStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."CreditStatus" AS ENUM ('PENDING', 'ACTIVE', 'USED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."LeadTime" AS ENUM ('ONE_TO_THREE_DAYS', 'ONE_TO_TWO_WEEKS', 'TWO_TO_FOUR_WEEKS');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "public"."PayoutSpeed" AS ENUM ('NET_30', 'EXPRESS');

-- CreateEnum
CREATE TYPE "public"."ProductAvailability" AS ENUM ('ACTIVE', 'INACTIVE', 'COMING_SOON');

-- CreateEnum
CREATE TYPE "public"."PromotionScope" AS ENUM ('CATALOG', 'COLLECTION');

-- CreateEnum
CREATE TYPE "public"."ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'LABEL_ISSUED', 'RECEIVED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('BUYER', 'BRAND', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."ShareLinkTarget" AS ENUM ('PRODUCT', 'COLLECTION', 'STOREFRONT');

-- CreateEnum
CREATE TYPE "public"."ShippingRateType" AS ENUM ('FLAT', 'PER_KG');

-- CreateEnum
CREATE TYPE "public"."ShippingZone" AS ENUM ('DOMESTIC', 'SOUTH_ASIA', 'SOUTHEAST_ASIA', 'MIDDLE_EAST', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'REST_OF_WORLD');

-- CreateEnum
CREATE TYPE "public"."TeamRole" AS ENUM ('ADMIN', 'CUSTOM');

-- CreateEnum
CREATE TYPE "public"."VariantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK');

-- CreateTable
CREATE TABLE "public"."BankAccount" (
    "id" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "accountHolderName" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "accountType" "public"."BankAccountType" NOT NULL DEFAULT 'SAVINGS',
    "upiId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BrandProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT[],
    "countryOfOrigin" TEXT NOT NULL DEFAULT 'IN',
    "gstNumber" TEXT,
    "businessRegNumber" TEXT,
    "description" TEXT,
    "brandStory" TEXT,
    "instagramHandle" TEXT,
    "websiteUrl" TEXT,
    "yearFounded" INTEGER,
    "socialLinks" JSONB,
    "existingRetailPartners" TEXT,
    "pickupPincode" TEXT,
    "logoUrl" TEXT,
    "bannerUrl" TEXT,
    "status" "public"."BrandStatus" NOT NULL DEFAULT 'PENDING',
    "achievementLevel" "public"."AchievementLevel" NOT NULL DEFAULT 'L1_SPROUT',
    "isAdminOverride" BOOLEAN NOT NULL DEFAULT false,
    "confirmedOrderCount" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalGmvInr" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "avgDispatchDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "payoutSpeed" "public"."PayoutSpeed" NOT NULL DEFAULT 'NET_30',
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "city" TEXT,
    "minimumOrderValue" INTEGER NOT NULL DEFAULT 0,
    "state" TEXT,
    "aadharUrl" TEXT,
    "defaultLeadTime" "public"."LeadTime",
    "defaultShippingZones" "public"."ShippingZone"[],
    "gstCertUrl" TEXT,
    "iecCertUrl" TEXT,
    "incorporateCertUrl" TEXT,
    "isoCertUrl" TEXT,
    "msmeCertUrl" TEXT,
    "panUrl" TEXT,
    "phone" TEXT,
    "registrationType" TEXT,
    "tagline" TEXT,
    "wholesaleProductCount" INTEGER,
    "returnsWindowDays" INTEGER,

    CONSTRAINT "BrandProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BuyerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "phone" TEXT,
    "preferredCurrency" TEXT NOT NULL DEFAULT 'USD',
    "storeType" TEXT,
    "aesthetic" TEXT,
    "categoryInterests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "businessVerified" BOOLEAN NOT NULL DEFAULT false,
    "businessVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "addressLine" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "state" TEXT,
    "notifNewArrivals" BOOLEAN NOT NULL DEFAULT true,
    "notifOrderUpdates" BOOLEAN NOT NULL DEFAULT true,
    "notifPromotions" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BuyerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BuyerReferral" (
    "id" TEXT NOT NULL,
    "referrerUserId" TEXT NOT NULL,
    "referredBrandId" TEXT,
    "token" TEXT NOT NULL,
    "rewardIssued" BOOLEAN NOT NULL DEFAULT false,
    "bonusIssued" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BuyerReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Cart" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CartItem" (
    "id" TEXT NOT NULL,
    "cartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "variantId" TEXT,

    CONSTRAINT "CartItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Collection" (
    "id" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CollectionProduct" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CollectionProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CrmContact" (
    "id" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "businessName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrmContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FxRateSnapshot" (
    "id" TEXT NOT NULL,
    "rates" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FxRateSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" TEXT NOT NULL,
    "orderId" TEXT,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" TEXT NOT NULL,
    "buyerUserId" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING',
    "subtotalInr" DECIMAL(12,2) NOT NULL,
    "shippingCostInr" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "commissionRate" DECIMAL(5,4) NOT NULL,
    "commissionInr" DECIMAL(10,2) NOT NULL,
    "totalInr" DECIMAL(12,2) NOT NULL,
    "buyerCurrency" TEXT NOT NULL,
    "totalBuyerCurrency" DECIMAL(12,2) NOT NULL,
    "fxRateUsed" DECIMAL(10,6) NOT NULL,
    "shippingZone" "public"."ShippingZone" NOT NULL,
    "isOpeningOrder" BOOLEAN NOT NULL DEFAULT false,
    "isManualOrder" BOOLEAN NOT NULL DEFAULT false,
    "trackingNumber" TEXT,
    "trackingCarrier" TEXT,
    "paypalOrderId" TEXT,
    "paypalCaptureId" TEXT,
    "dispatchedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "shareLinkId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "disputeReason" TEXT,
    "disputeResolution" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceInr" DECIMAL(12,2) NOT NULL,
    "totalInr" DECIMAL(12,2) NOT NULL,
    "variantId" TEXT,
    "variantLabel" TEXT,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payout" (
    "id" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "grossInr" DECIMAL(12,2) NOT NULL,
    "commissionInr" DECIMAL(10,2) NOT NULL,
    "processingFeeInr" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "netInr" DECIMAL(12,2) NOT NULL,
    "payoutSpeed" "public"."PayoutSpeed" NOT NULL DEFAULT 'NET_30',
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "scheduledAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "paypalBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "slug" TEXT NOT NULL,
    "wholesalePriceInr" DECIMAL(12,2) NOT NULL,
    "moq" INTEGER NOT NULL,
    "leadTime" "public"."LeadTime" NOT NULL,
    "weightGrams" INTEGER NOT NULL,
    "hsTariffCode" TEXT,
    "countryOfOrigin" TEXT NOT NULL DEFAULT 'IN',
    "categories" TEXT[],
    "tags" TEXT[],
    "availability" "public"."ProductAvailability" NOT NULL DEFAULT 'ACTIVE',
    "enabledZones" "public"."ShippingZone"[],
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "stepQty" INTEGER NOT NULL DEFAULT 1,
    "artisanName" TEXT,
    "dimensions" TEXT,
    "howItIsMade" TEXT,
    "isGITagged" BOOLEAN NOT NULL DEFAULT false,
    "isHandmade" BOOLEAN NOT NULL DEFAULT false,
    "material" TEXT,
    "placeOfOrigin" TEXT,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductPhoto" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mediaType" TEXT NOT NULL DEFAULT 'image',

    CONSTRAINT "ProductPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductPriceTier" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "moq" INTEGER NOT NULL,
    "priceInr" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "ProductPriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductReview" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reviewerUserId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "brandResponse" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageUrl" TEXT,
    "priceInr" DECIMAL(12,2) NOT NULL,
    "sku" TEXT NOT NULL,
    "status" "public"."VariantStatus" NOT NULL DEFAULT 'ACTIVE',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PromotedListing" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "bidAmountInr" DECIMAL(10,2) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromotedListing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Promotion" (
    "id" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "discountPercent" INTEGER NOT NULL,
    "scope" "public"."PromotionScope" NOT NULL,
    "collectionId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Promotion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Return" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "public"."ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "isOpeningOrder" BOOLEAN NOT NULL DEFAULT false,
    "adminNotes" TEXT,
    "returnLabelUrl" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Return_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SavedBrand" (
    "id" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SavedProduct" (
    "id" TEXT NOT NULL,
    "buyerProfileId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShareLink" (
    "id" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "slug" TEXT,
    "target" "public"."ShareLinkTarget" NOT NULL,
    "productId" TEXT,
    "collectionId" TEXT,
    "customMessage" TEXT,
    "password" TEXT,
    "lockedCurrency" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "signupCount" INTEGER NOT NULL DEFAULT 0,
    "orderCount" INTEGER NOT NULL DEFAULT 0,
    "revenueInr" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "commissionSavedInr" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShippingRate" (
    "id" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "zone" "public"."ShippingZone" NOT NULL,
    "rateType" "public"."ShippingRateType" NOT NULL,
    "flatRateInr" DECIMAL(10,2),
    "perKgRateInr" DECIMAL(10,2),
    "freeShippingAboveInr" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShopifyStore" (
    "id" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifyStore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeamMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "role" "public"."TeamRole" NOT NULL DEFAULT 'CUSTOM',
    "canViewPayouts" BOOLEAN NOT NULL DEFAULT false,
    "canViewAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "googleId" TEXT,
    "avatarUrl" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'BUYER',
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserShareLinkAttribution" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shareLinkId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserShareLinkAttribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VariantAttribute" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "VariantAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Wallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balanceInr" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WalletCredit" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amountInr" DECIMAL(10,2) NOT NULL,
    "status" "public"."CreditStatus" NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WhatsappBroadcast" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL DEFAULT 'en',
    "components" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "sentCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappBroadcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WhatsappBroadcastRecipient" (
    "id" TEXT NOT NULL,
    "broadcastId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "messageId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappBroadcastRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WhatsappSession" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "step" TEXT NOT NULL DEFAULT 'IDLE',
    "data" JSONB NOT NULL DEFAULT '{}',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BankAccount_brandProfileId_key" ON "public"."BankAccount"("brandProfileId" ASC);

-- CreateIndex
CREATE INDEX "BrandProfile_achievementLevel_idx" ON "public"."BrandProfile"("achievementLevel" ASC);

-- CreateIndex
CREATE INDEX "BrandProfile_slug_idx" ON "public"."BrandProfile"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "BrandProfile_slug_key" ON "public"."BrandProfile"("slug" ASC);

-- CreateIndex
CREATE INDEX "BrandProfile_status_idx" ON "public"."BrandProfile"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "BrandProfile_userId_key" ON "public"."BrandProfile"("userId" ASC);

-- CreateIndex
CREATE INDEX "BuyerProfile_userId_idx" ON "public"."BuyerProfile"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "BuyerProfile_userId_key" ON "public"."BuyerProfile"("userId" ASC);

-- CreateIndex
CREATE INDEX "BuyerReferral_referredBrandId_idx" ON "public"."BuyerReferral"("referredBrandId" ASC);

-- CreateIndex
CREATE INDEX "BuyerReferral_referrerUserId_idx" ON "public"."BuyerReferral"("referrerUserId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "BuyerReferral_token_key" ON "public"."BuyerReferral"("token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Cart_userId_key" ON "public"."Cart"("userId" ASC);

-- CreateIndex
CREATE INDEX "CartItem_cartId_idx" ON "public"."CartItem"("cartId" ASC);

-- CreateIndex
CREATE INDEX "CartItem_variantId_idx" ON "public"."CartItem"("variantId" ASC);

-- CreateIndex
CREATE INDEX "Category_isActive_idx" ON "public"."Category"("isActive" ASC);

-- CreateIndex
CREATE INDEX "Category_level_idx" ON "public"."Category"("level" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "public"."Category"("name" ASC);

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "public"."Category"("slug" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "public"."Category"("slug" ASC);

-- CreateIndex
CREATE INDEX "Category_sortOrder_idx" ON "public"."Category"("sortOrder" ASC);

-- CreateIndex
CREATE INDEX "Collection_brandProfileId_idx" ON "public"."Collection"("brandProfileId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CollectionProduct_collectionId_productId_key" ON "public"."CollectionProduct"("collectionId" ASC, "productId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "CrmContact_brandProfileId_email_key" ON "public"."CrmContact"("brandProfileId" ASC, "email" ASC);

-- CreateIndex
CREATE INDEX "CrmContact_brandProfileId_idx" ON "public"."CrmContact"("brandProfileId" ASC);

-- CreateIndex
CREATE INDEX "FxRateSnapshot_fetchedAt_idx" ON "public"."FxRateSnapshot"("fetchedAt" ASC);

-- CreateIndex
CREATE INDEX "Message_orderId_idx" ON "public"."Message"("orderId" ASC);

-- CreateIndex
CREATE INDEX "Message_recipientId_idx" ON "public"."Message"("recipientId" ASC);

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "public"."Message"("senderId" ASC);

-- CreateIndex
CREATE INDEX "Order_brandProfileId_idx" ON "public"."Order"("brandProfileId" ASC);

-- CreateIndex
CREATE INDEX "Order_buyerUserId_idx" ON "public"."Order"("buyerUserId" ASC);

-- CreateIndex
CREATE INDEX "Order_shareLinkId_idx" ON "public"."Order"("shareLinkId" ASC);

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "public"."Order"("status" ASC);

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "public"."OrderItem"("orderId" ASC);

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "public"."OrderItem"("productId" ASC);

-- CreateIndex
CREATE INDEX "OrderItem_variantId_idx" ON "public"."OrderItem"("variantId" ASC);

-- CreateIndex
CREATE INDEX "Payout_brandProfileId_idx" ON "public"."Payout"("brandProfileId" ASC);

-- CreateIndex
CREATE INDEX "Payout_isPaid_idx" ON "public"."Payout"("isPaid" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Payout_orderId_key" ON "public"."Payout"("orderId" ASC);

-- CreateIndex
CREATE INDEX "Product_availability_idx" ON "public"."Product"("availability" ASC);

-- CreateIndex
CREATE INDEX "Product_brandProfileId_idx" ON "public"."Product"("brandProfileId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "public"."Product"("slug" ASC);

-- CreateIndex
CREATE INDEX "ProductPhoto_productId_idx" ON "public"."ProductPhoto"("productId" ASC);

-- CreateIndex
CREATE INDEX "ProductPriceTier_productId_idx" ON "public"."ProductPriceTier"("productId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ProductReview_orderId_productId_key" ON "public"."ProductReview"("orderId" ASC, "productId" ASC);

-- CreateIndex
CREATE INDEX "ProductReview_productId_idx" ON "public"."ProductReview"("productId" ASC);

-- CreateIndex
CREATE INDEX "ProductReview_reviewerUserId_idx" ON "public"."ProductReview"("reviewerUserId" ASC);

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "public"."ProductVariant"("productId" ASC);

-- CreateIndex
CREATE INDEX "ProductVariant_sku_idx" ON "public"."ProductVariant"("sku" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "public"."ProductVariant"("sku" ASC);

-- CreateIndex
CREATE INDEX "PromotedListing_brandProfileId_idx" ON "public"."PromotedListing"("brandProfileId" ASC);

-- CreateIndex
CREATE INDEX "PromotedListing_isActive_idx" ON "public"."PromotedListing"("isActive" ASC);

-- CreateIndex
CREATE INDEX "PromotedListing_productId_idx" ON "public"."PromotedListing"("productId" ASC);

-- CreateIndex
CREATE INDEX "Promotion_brandProfileId_idx" ON "public"."Promotion"("brandProfileId" ASC);

-- CreateIndex
CREATE INDEX "Promotion_isActive_idx" ON "public"."Promotion"("isActive" ASC);

-- CreateIndex
CREATE INDEX "Return_orderId_idx" ON "public"."Return"("orderId" ASC);

-- CreateIndex
CREATE INDEX "Return_status_idx" ON "public"."Return"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SavedBrand_buyerProfileId_brandProfileId_key" ON "public"."SavedBrand"("buyerProfileId" ASC, "brandProfileId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "SavedProduct_buyerProfileId_productId_key" ON "public"."SavedProduct"("buyerProfileId" ASC, "productId" ASC);

-- CreateIndex
CREATE INDEX "ShareLink_brandProfileId_idx" ON "public"."ShareLink"("brandProfileId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_slug_key" ON "public"."ShareLink"("slug" ASC);

-- CreateIndex
CREATE INDEX "ShareLink_token_idx" ON "public"."ShareLink"("token" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_token_key" ON "public"."ShareLink"("token" ASC);

-- CreateIndex
CREATE INDEX "ShippingRate_brandProfileId_idx" ON "public"."ShippingRate"("brandProfileId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ShippingRate_brandProfileId_zone_key" ON "public"."ShippingRate"("brandProfileId" ASC, "zone" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyStore_brandProfileId_key" ON "public"."ShopifyStore"("brandProfileId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyStore_shopDomain_key" ON "public"."ShopifyStore"("shopDomain" ASC);

-- CreateIndex
CREATE INDEX "TeamMember_ownerUserId_idx" ON "public"."TeamMember"("ownerUserId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_userId_ownerUserId_key" ON "public"."TeamMember"("userId" ASC, "ownerUserId" ASC);

-- CreateIndex
CREATE INDEX "User_email_idx" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE INDEX "User_googleId_idx" ON "public"."User"("googleId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "public"."User"("googleId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "UserShareLinkAttribution_userId_shareLinkId_key" ON "public"."UserShareLinkAttribution"("userId" ASC, "shareLinkId" ASC);

-- CreateIndex
CREATE INDEX "VariantAttribute_name_idx" ON "public"."VariantAttribute"("name" ASC);

-- CreateIndex
CREATE INDEX "VariantAttribute_variantId_idx" ON "public"."VariantAttribute"("variantId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_key" ON "public"."Wallet"("userId" ASC);

-- CreateIndex
CREATE INDEX "WalletCredit_status_idx" ON "public"."WalletCredit"("status" ASC);

-- CreateIndex
CREATE INDEX "WalletCredit_walletId_idx" ON "public"."WalletCredit"("walletId" ASC);

-- CreateIndex
CREATE INDEX "WhatsappBroadcastRecipient_broadcastId_idx" ON "public"."WhatsappBroadcastRecipient"("broadcastId" ASC);

-- CreateIndex
CREATE INDEX "WhatsappBroadcastRecipient_status_idx" ON "public"."WhatsappBroadcastRecipient"("status" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappSession_phone_key" ON "public"."WhatsappSession"("phone" ASC);

-- CreateIndex
CREATE INDEX "WhatsappSession_userId_idx" ON "public"."WhatsappSession"("userId" ASC);

-- AddForeignKey
ALTER TABLE "public"."BankAccount" ADD CONSTRAINT "BankAccount_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "public"."BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BrandProfile" ADD CONSTRAINT "BrandProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BuyerProfile" ADD CONSTRAINT "BuyerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BuyerReferral" ADD CONSTRAINT "BuyerReferral_referredBrandId_fkey" FOREIGN KEY ("referredBrandId") REFERENCES "public"."BrandProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BuyerReferral" ADD CONSTRAINT "BuyerReferral_referrerUserId_fkey" FOREIGN KEY ("referrerUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Cart" ADD CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "public"."Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CartItem" ADD CONSTRAINT "CartItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Collection" ADD CONSTRAINT "Collection_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "public"."BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollectionProduct" ADD CONSTRAINT "CollectionProduct_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollectionProduct" ADD CONSTRAINT "CollectionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CrmContact" ADD CONSTRAINT "CrmContact_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "public"."BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "public"."BrandProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_buyerUserId_fkey" FOREIGN KEY ("buyerUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_shareLinkId_fkey" FOREIGN KEY ("shareLinkId") REFERENCES "public"."ShareLink"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payout" ADD CONSTRAINT "Payout_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "public"."BrandProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payout" ADD CONSTRAINT "Payout_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Product" ADD CONSTRAINT "Product_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "public"."BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductPhoto" ADD CONSTRAINT "ProductPhoto_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductPriceTier" ADD CONSTRAINT "ProductPriceTier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductReview" ADD CONSTRAINT "ProductReview_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductReview" ADD CONSTRAINT "ProductReview_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductReview" ADD CONSTRAINT "ProductReview_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromotedListing" ADD CONSTRAINT "PromotedListing_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "public"."BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PromotedListing" ADD CONSTRAINT "PromotedListing_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Promotion" ADD CONSTRAINT "Promotion_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "public"."BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Promotion" ADD CONSTRAINT "Promotion_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Return" ADD CONSTRAINT "Return_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedBrand" ADD CONSTRAINT "SavedBrand_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "public"."BuyerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedProduct" ADD CONSTRAINT "SavedProduct_buyerProfileId_fkey" FOREIGN KEY ("buyerProfileId") REFERENCES "public"."BuyerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SavedProduct" ADD CONSTRAINT "SavedProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShareLink" ADD CONSTRAINT "ShareLink_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "public"."BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShippingRate" ADD CONSTRAINT "ShippingRate_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "public"."BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ShopifyStore" ADD CONSTRAINT "ShopifyStore_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "public"."BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."UserShareLinkAttribution" ADD CONSTRAINT "UserShareLinkAttribution_shareLinkId_fkey" FOREIGN KEY ("shareLinkId") REFERENCES "public"."ShareLink"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VariantAttribute" ADD CONSTRAINT "VariantAttribute_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "public"."ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WalletCredit" ADD CONSTRAINT "WalletCredit_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "public"."Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."WhatsappBroadcastRecipient" ADD CONSTRAINT "WhatsappBroadcastRecipient_broadcastId_fkey" FOREIGN KEY ("broadcastId") REFERENCES "public"."WhatsappBroadcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

