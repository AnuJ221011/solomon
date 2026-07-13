import { z } from 'zod';

const baseShareLinkSchema = z.object({
  name: z.string().max(120).optional(),
  target: z.enum(['PRODUCT', 'COLLECTION', 'STOREFRONT']),
  productId: z.string().optional(),
  collectionId: z.string().optional(),
  customMessage: z.string().max(300).optional(),
  password: z.string().optional(),
  lockedCurrency: z.string().length(3).optional(),
  expiresAt: z.string().datetime().optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').optional(),
});

export const createShareLinkSchema = baseShareLinkSchema
  .refine((data) => data.target !== 'PRODUCT' || !!data.productId, {
    message: 'productId is required when target is PRODUCT',
    path: ['productId'],
  })
  .refine((data) => data.target !== 'COLLECTION' || !!data.collectionId, {
    message: 'collectionId is required when target is COLLECTION',
    path: ['collectionId'],
  });

export const updateShareLinkSchema = baseShareLinkSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const recordVisitSchema = z.object({
  identifier: z.string(),
  isUnique: z.boolean().default(false),
});
