import { z } from 'zod';

const shippingZoneEnum = z.enum([
  'DOMESTIC', 'SOUTH_ASIA', 'SOUTHEAST_ASIA', 'MIDDLE_EAST',
  'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'REST_OF_WORLD',
]);

export const createProductSchema = z.object({
  name: z.string().min(1).max(80),
  shortDescription: z.string().min(1).max(160),
  fullDescription: z.string().optional(),
  wholesalePriceInr: z.number().positive(),
  msrpInr: z.number().positive().optional(),
  moq: z.number().int().positive(),
  leadTime: z.enum(['ONE_TO_THREE_DAYS', 'ONE_TO_TWO_WEEKS', 'TWO_TO_FOUR_WEEKS']),
  weightGrams: z.number().int().positive(),
  hsTariffCode: z.string().optional(),
  countryOfOrigin: z.string().length(2).default('IN'),
  categories: z.array(z.string()).min(1).max(2),
  tags: z.array(z.string()).max(10).default([]),
  availability: z.enum(['ACTIVE', 'INACTIVE', 'COMING_SOON']).default('ACTIVE'),
  enabledZones: z.array(shippingZoneEnum).min(1),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  zone: shippingZoneEnum.optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  availability: z.enum(['ACTIVE', 'INACTIVE', 'COMING_SOON']).optional(),
  brandId: z.string().optional(),
  sortBy: z.enum(['rank', 'createdAt', 'wholesalePriceInr', 'name']).default('rank'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
