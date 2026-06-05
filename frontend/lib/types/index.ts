// ── Shared types matching the backend schema ──────────────────────

export type AchievementLevel =
  | "L1_SPROUT"
  | "L2_RISING"
  | "L3_TRUSTED"
  | "L4_ELITE"
  | "L5_LEGEND";

export type OrderStatus =
  | "PENDING" | "CONFIRMED" | "PROCESSING"
  | "DISPATCHED" | "DELIVERED" | "CANCELLED" | "DISPUTED";

export type ShippingZone =
  | "DOMESTIC" | "SOUTH_ASIA" | "SOUTHEAST_ASIA" | "MIDDLE_EAST"
  | "EUROPE" | "NORTH_AMERICA" | "OCEANIA" | "REST_OF_WORLD";

// ── Product ──────────────────────────────────────────────────────

export interface ProductPhoto {
  id: string;
  url: string;
  publicId: string;
  position: number;
}

export interface BrandSummary {
  id: string;
  brandName: string;
  slug: string;
  achievementLevel: AchievementLevel;
  avgRating?: number;
  logoUrl?: string | null;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription?: string | null;
  wholesalePriceInr: number;
  msrpInr?: number | null;
  moq: number;
  leadTime: string;
  weightGrams: number;
  categories: string[];
  tags: string[];
  availability: "ACTIVE" | "INACTIVE" | "COMING_SOON";
  enabledZones: ShippingZone[];
  photos: ProductPhoto[];
  brandProfile: BrandSummary;
  viewCount: number;
  orderCount: number;
  createdAt: string;
}

// ── Brand ────────────────────────────────────────────────────────

export interface BrandProfile {
  id: string;
  brandName: string;
  slug: string;
  category: string[];
  description?: string | null;
  brandStory?: string | null;
  instagramHandle?: string | null;
  websiteUrl?: string | null;
  yearFounded?: number | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  achievementLevel: AchievementLevel;
  avgRating: number;
  confirmedOrderCount: number;
  totalGmvInr: number;
  payoutSpeed: "NET_30" | "EXPRESS";
}

// ── Order ────────────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPriceInr: number;
  totalInr: number;
  product: { name: string; slug: string };
}

export interface Order {
  id: string;
  status: OrderStatus;
  subtotalInr: number;
  shippingCostInr: number;
  commissionRate: number;
  totalInr: number;
  buyerCurrency: string;
  totalBuyerCurrency: number;
  isOpeningOrder: boolean;
  isManualOrder: boolean;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  items: OrderItem[];
  brand: { brandName: string; slug: string; logoUrl?: string | null };
  createdAt: string;
  dispatchedAt?: string | null;
  deliveredAt?: string | null;
}

// ── Cart ─────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  variantOptions?: Record<string, string> | null;
  product: Product;
}

export interface Cart {
  id: string;
  items: CartItem[];
}

// ── Share link ───────────────────────────────────────────────────

export interface ShareLink {
  id: string;
  token: string;
  slug?: string | null;
  target: "PRODUCT" | "COLLECTION" | "STOREFRONT";
  customMessage?: string | null;
  lockedCurrency?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
  viewCount: number;
  uniqueVisitors: number;
  signupCount: number;
  orderCount: number;
  revenueInr: number;
  commissionSavedInr: number;
  brandProfile: { brandName: string; slug: string; logoUrl?: string | null };
}

// ── API response wrapper ─────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
