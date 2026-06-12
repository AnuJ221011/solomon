import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../config/db.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { createError } from '../../shared/utils/createError.js';
import { sendSuccess } from '../../shared/utils/response.js';

const router = Router();

const submitSchema = z.object({
  productId: z.string().min(1),
  bidAmountInr: z.number().positive().min(100),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
});

const getBrandId = async (userId) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);
  return brand.id;
};

// Brand — submit a promoted listing bid
router.post('/', authenticate, authorize('BRAND'), validate(submitSchema), async (req, res) => {
  const brandProfileId = await getBrandId(req.user.id);
  const { productId, bidAmountInr, startsAt, endsAt } = req.body;

  const product = await prisma.product.findFirst({ where: { id: productId, brandProfileId } });
  if (!product) throw createError('Product not found', 404);

  const promo = await prisma.promotedListing.create({
    data: {
      productId,
      brandProfileId,
      bidAmountInr,
      startsAt: new Date(startsAt),
      endsAt: endsAt ? new Date(endsAt) : null,
      isActive: false, // Admin must activate
    },
  });
  sendSuccess(res, promo, 'Listing submitted, awaiting admin activation.', 201);
});

// Brand — list own promoted listings
router.get('/', authenticate, authorize('BRAND'), async (req, res) => {
  const brandProfileId = await getBrandId(req.user.id);
  const listings = await prisma.promotedListing.findMany({
    where: { brandProfileId },
    include: { product: { select: { name: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, listings);
});

// Brand — cancel a promoted listing
router.delete('/:id', authenticate, authorize('BRAND'), async (req, res) => {
  const brandProfileId = await getBrandId(req.user.id);
  const listing = await prisma.promotedListing.findFirst({ where: { id: req.params.id, brandProfileId } });
  if (!listing) throw createError('Promoted listing not found', 404);
  await prisma.promotedListing.delete({ where: { id: listing.id } });
  sendSuccess(res, null, 'Promoted listing cancelled successfully.');
});

// Admin — activate / deactivate a promoted listing
router.post('/:id/activate', authenticate, authorize('ADMIN'), async (req, res) => {
  const listing = await prisma.promotedListing.update({
    where: { id: req.params.id },
    data: { isActive: true },
  });
  sendSuccess(res, listing, 'Promoted listing is now live.');
});

router.post('/:id/deactivate', authenticate, authorize('ADMIN'), async (req, res) => {
  const listing = await prisma.promotedListing.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  sendSuccess(res, listing, 'Promoted listing paused successfully.');
});

// Admin — list all active promotions
router.get('/admin/active', authenticate, authorize('ADMIN'), async (req, res) => {
  const listings = await prisma.promotedListing.findMany({
    where: { isActive: true },
    include: {
      product: { select: { name: true, slug: true } },
      brandProfile: { select: { brandName: true } },
    },
    orderBy: { bidAmountInr: 'desc' },
  });
  sendSuccess(res, listings);
});

export default router;
