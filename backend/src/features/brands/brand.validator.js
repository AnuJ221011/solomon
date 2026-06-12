import { z } from 'zod';

export const updateBrandProfileSchema = z.object({
  brandName: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  brandStory: z.string().max(1000).optional(),
  category: z.array(z.string()).min(1).max(2).optional(),
  countryOfOrigin: z.string().length(2).optional(),
  gstNumber: z.string().optional(),
  businessRegNumber: z.string().optional(),
  instagramHandle: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  yearFounded: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  socialLinks: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    pinterest: z.string().optional(),
  }).optional(),
  existingRetailPartners: z.string().max(500).optional(),
  pickupPincode: z.string().max(10).optional(),
  payoutSpeed: z.enum(['NET_30', 'EXPRESS']).optional(),
});

export const brandQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED']).optional(),
  level: z.enum(['L1_SPROUT', 'L2_RISING', 'L3_TRUSTED', 'L4_ELITE', 'L5_LEGEND']).optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  slugs: z.string().optional(),
});
