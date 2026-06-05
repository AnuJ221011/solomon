import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../config/db.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { createError } from '../../shared/utils/createError.js';
import { sendSuccess } from '../../shared/utils/response.js';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1).max(100),
  discountPercent: z.number().int().min(1).max(90),
  scope: z.enum(['CATALOG', 'COLLECTION']),
  collectionId: z.string().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
}).refine((d) => d.scope !== 'COLLECTION' || d.collectionId, {
  message: 'collectionId required when scope is COLLECTION',
});

const getBrandId = async (userId) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);
  return brand.id;
};

router.use(authenticate, authorize('BRAND'));

router.get('/', async (req, res) => {
  const brandProfileId = await getBrandId(req.user.id);
  const promotions = await prisma.promotion.findMany({
    where: { brandProfileId },
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, promotions);
});

router.post('/', validate(createSchema), async (req, res) => {
  const brandProfileId = await getBrandId(req.user.id);
  const promo = await prisma.promotion.create({
    data: { ...req.body, brandProfileId, startsAt: new Date(req.body.startsAt), endsAt: req.body.endsAt ? new Date(req.body.endsAt) : null },
  });
  sendSuccess(res, promo, 'Promotion created', 201);
});

router.patch('/:id', async (req, res) => {
  const brandProfileId = await getBrandId(req.user.id);
  const promo = await prisma.promotion.findFirst({ where: { id: req.params.id, brandProfileId } });
  if (!promo) throw createError('Promotion not found', 404);
  const updated = await prisma.promotion.update({ where: { id: promo.id }, data: { ...req.body, isActive: req.body.isActive } });
  sendSuccess(res, updated, 'Promotion updated');
});

router.delete('/:id', async (req, res) => {
  const brandProfileId = await getBrandId(req.user.id);
  const promo = await prisma.promotion.findFirst({ where: { id: req.params.id, brandProfileId } });
  if (!promo) throw createError('Promotion not found', 404);
  await prisma.promotion.delete({ where: { id: promo.id } });
  sendSuccess(res, null, 'Promotion deleted');
});

export default router;
