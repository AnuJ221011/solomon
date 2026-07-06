import { z } from 'zod';

const shippingZoneEnum = z.enum([
  'DOMESTIC', 'SOUTH_ASIA', 'SOUTHEAST_ASIA', 'MIDDLE_EAST',
  'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'REST_OF_WORLD',
]);

const priceTierSchema = z.object({
  moq: z.number().int().positive(),
  priceInr: z.number().positive(),
});

export const createProductSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().min(1),
  wholesalePriceInr: z.number().positive(),
  moq: z.number().int().positive(),
  stepQty: z.number().int().positive().default(1),
  leadTime: z.enum(['ONE_TO_THREE_DAYS', 'ONE_TO_TWO_WEEKS', 'TWO_TO_FOUR_WEEKS']),
  weightGrams: z.number().int().positive(),
  hsTariffCode: z.string().optional(),
  countryOfOrigin: z.string().length(2).default('IN'),
  categories: z.array(z.string()).min(1).max(2),
  tags: z.array(z.string()).max(10).default([]),
  availability: z.enum(['ACTIVE', 'INACTIVE', 'COMING_SOON']).default('ACTIVE'),
  enabledZones: z.array(shippingZoneEnum).min(1),
  // Tiered / volume pricing (sorted ascending by moq on create)
  priceTiers: z.array(priceTierSchema).min(1).optional(),
  // Product attributes
  material: z.string().max(200).optional(),
  dimensions: z.string().max(200).optional(),
  isHandmade: z.boolean().default(false),
  placeOfOrigin: z.string().max(200).optional(),
  isGITagged: z.boolean().default(false),
  // Craft story
  howItIsMade: z.string().optional(),
  artisanName: z.string().max(200).optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  zone: shippingZoneEnum.optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  availability: z.enum(['ACTIVE', 'INACTIVE', 'COMING_SOON']).optional(),
  brandId: z.string().optional(),
  brandSlug: z.string().optional(),
  sortBy: z.enum(['rank', 'createdAt', 'wholesalePriceInr', 'name']).default('rank'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  // JSON-encoded { [attrName]: string[] } for attribute filtering
  attrs: z.string().optional(),
});
