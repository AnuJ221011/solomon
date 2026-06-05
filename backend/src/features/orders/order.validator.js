import { z } from 'zod';

export const createOrdersFromCartSchema = z.object({
  shippingAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    postalCode: z.string().min(1),
    countryCode: z.string().length(2),
  }),
  paypalOrderId: z.string().min(1),
  // Credit amount buyer wants to apply (validated server-side against wallet)
  walletCreditsToApplyInr: z.number().min(0).default(0),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'CANCELLED']),
  trackingNumber: z.string().optional(),
  trackingCarrier: z.string().optional(),
});

export const createManualOrderSchema = z.object({
  buyerEmail: z.string().email(),
  buyerName: z.string().min(1),
  buyerBusinessName: z.string().min(1),
  countryCode: z.string().length(2),
  shippingAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    postalCode: z.string().min(1),
    countryCode: z.string().length(2),
  }),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().positive(),
    variantOptions: z.any().optional(),
  })).min(1),
  notes: z.string().optional(),
});

export const orderQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'DISPUTED']).optional(),
  search: z.string().optional(),
  isManualOrder: z.coerce.boolean().optional(),
  shareLinkId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});
