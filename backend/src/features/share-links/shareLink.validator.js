import { z } from 'zod';

export const createShareLinkSchema = z.object({
  target: z.enum(['PRODUCT', 'COLLECTION', 'STOREFRONT']),
  productId: z.string().optional(),
  collectionName: z.string().optional(),
  customMessage: z.string().max(300).optional(),
  password: z.string().optional(),
  lockedCurrency: z.string().length(3).optional(),
  expiresAt: z.string().datetime().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').optional(),
});

export const updateShareLinkSchema = createShareLinkSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const recordVisitSchema = z.object({
  token: z.string(),
  isUnique: z.boolean().default(false),
});
