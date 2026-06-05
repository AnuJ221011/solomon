import { z } from 'zod';

export const upsertShippingRateSchema = z.object({
  zone: z.enum([
    'DOMESTIC', 'SOUTH_ASIA', 'SOUTHEAST_ASIA', 'MIDDLE_EAST',
    'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'REST_OF_WORLD',
  ]),
  rateType: z.enum(['FLAT', 'PER_KG']),
  flatRateInr: z.number().positive().optional(),
  perKgRateInr: z.number().positive().optional(),
  freeShippingAboveInr: z.number().positive().optional(),
}).refine((d) => {
  if (d.rateType === 'FLAT' && !d.flatRateInr) return false;
  if (d.rateType === 'PER_KG' && !d.perKgRateInr) return false;
  return true;
}, { message: 'Rate value required for selected rate type' });
