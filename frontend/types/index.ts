// ─── Core Domain Types ────────────────────────────────────────────────────────

export type Currency = string // ISO 4217, e.g. 'INR', 'USD', 'EUR'

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'DISPUTED'
  | 'CANCELLED'

// ─── Users & Auth ─────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  role: 'BUYER' | 'BRAND' | 'ADMIN'
  name: string
  avatar?: string
  verified: boolean
}

// ─── Products ─────────────────────────────────────────────────────────────────

export interface ProductVariantAttribute {
  id: string
  name: string
  value: string
}

export interface ProductVariant {
  id: string
  sku: string
  priceInr: number
  stock: number
  status: string
  attributes: ProductVariantAttribute[]
}

export interface Product {
  id: string
  name: string
  slug: string
  brandId: string
  brandName: string
  brandSlug: string
  description: string
  images: string[] // Cloudinary URLs
  wholesalePrice: number // INR
  displayPrice?: number // local currency
  currency?: string
  moq: number
  leadTime: '1-3 days' | '1-2 weeks' | '2-4 weeks'
  weight: number
  category: string
  tags: string[]
  achievementLevel?: 1 | 2 | 3 | 4 | 5
  brandMinimumOrderValue?: number
  brandLogoUrl?: string | null
  inStock: boolean
  variants?: ProductVariant[]
  countryOfOrigin?: string
  freeShippingAboveInr?: number | null
  returnsWindowDays?: number | null
}

// ─── Brands ───────────────────────────────────────────────────────────────────

export interface Brand {
  id: string
  name: string
  slug: string
  logo?: string
  banner?: string
  description: string
  location: string
  yearFounded?: number
  achievementLevel: 1 | 2 | 3 | 4 | 5
  tagline?: string
  productCount: number
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface Order {
  id: string
  orderNumber: string
  buyerName: string
  status: OrderStatus
  amount: number
  currency: string
  createdAt: string
  dispatchedAt?: string
  trackingNumber?: string
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string
  productName: string
  brandId: string
  brandName: string
  brandSlug: string
  image: string
  quantity: number
  wholesalePrice: number
  moq: number
  leadTime?: string
  achievementLevel?: number
  brandMinimumOrderValue?: number
}

// ─── Share Links ──────────────────────────────────────────────────────────────

export interface ShareLink {
  id: string
  slug: string
  brandId: string
  brandName: string
  linkType: 'BRAND' | 'PRODUCT' | 'COLLECTION'
  target: string
  views: number
  orders: number
  revenue: number
  active: boolean
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export interface AchievementCriteria {
  label: string
  target: number
  current: number
  met: boolean
}

export interface Achievement {
  level: 1 | 2 | 3 | 4 | 5
  name: 'Sprout' | 'Rising' | 'Trusted' | 'Elite' | 'Legend'
  criteria: AchievementCriteria[]
}

// ─── Payouts ──────────────────────────────────────────────────────────────────

export interface Payout {
  id: string
  orderId: string
  orderNumber: string
  grossAmount: number
  commissionRate: number
  commissionAmount: number
  netAmount: number
  status: 'PENDING' | 'PROCESSING' | 'PAID'
  createdAt: string
  paidAt?: string
}

// ─── Buyer / Brand Stats ──────────────────────────────────────────────────────

export interface BuyerStats {
  totalOrders: number
  totalSpend: number
  savedBrands: number
  referralCount: number
  walletBalance: number
}

export interface BrandStats {
  gmvThisMonth: number
  ordersThisMonth: number
  avgOrderValue: number
  commissionSaved: number
  totalOrders: number
  avgRating: number
}
