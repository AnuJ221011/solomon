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
  name: z.string().min(1).max(80),
  description: z.string().max(300).optional(),
});

const addProductSchema = z.object({
  productId: z.string().min(1),
  position: z.number().int().min(0).default(0),
});

const getBrandId = async (userId) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);
  return brand.id;
};

router.use(authenticate, authorize('BRAND'));

router.get('/', async (req, res) => {
  const brandProfileId = await getBrandId(req.user.id);
  const collections = await prisma.collection.findMany({
    where: { brandProfileId },
    include: { products: { include: { product: { include: { photos: { take: 1 } } } }, orderBy: { position: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, collections);
});

router.post('/', validate(createSchema), async (req, res) => {
  const brandProfileId = await getBrandId(req.user.id);
  const collection = await prisma.collection.create({
    data: { ...req.body, brandProfileId },
  });
  sendSuccess(res, collection, 'Collection created', 201);
});

router.patch('/:id', validate(createSchema.partial()), async (req, res) => {
  const brandProfileId = await getBrandId(req.user.id);
  const col = await prisma.collection.findFirst({ where: { id: req.params.id, brandProfileId } });
  if (!col) throw createError('Collection not found', 404);
  const updated = await prisma.collection.update({ where: { id: col.id }, data: req.body });
  sendSuccess(res, updated, 'Collection updated');
});

router.delete('/:id', async (req, res) => {
  const brandProfileId = await getBrandId(req.user.id);
  const col = await prisma.collection.findFirst({ where: { id: req.params.id, brandProfileId } });
  if (!col) throw createError('Collection not found', 404);
  await prisma.collection.delete({ where: { id: col.id } });
  sendSuccess(res, null, 'Collection deleted');
});

router.post('/:id/products', validate(addProductSchema), async (req, res) => {
  const brandProfileId = await getBrandId(req.user.id);
  const col = await prisma.collection.findFirst({ where: { id: req.params.id, brandProfileId } });
  if (!col) throw createError('Collection not found', 404);

  const item = await prisma.collectionProduct.upsert({
    where: { collectionId_productId: { collectionId: col.id, productId: req.body.productId } },
    create: { collectionId: col.id, productId: req.body.productId, position: req.body.position },
    update: { position: req.body.position },
  });
  sendSuccess(res, item, 'Product added to collection');
});

router.delete('/:id/products/:productId', async (req, res) => {
  const brandProfileId = await getBrandId(req.user.id);
  const col = await prisma.collection.findFirst({ where: { id: req.params.id, brandProfileId } });
  if (!col) throw createError('Collection not found', 404);
  await prisma.collectionProduct.delete({
    where: { collectionId_productId: { collectionId: col.id, productId: req.params.productId } },
  }).catch(() => {});
  sendSuccess(res, null, 'Product removed from collection');
});

export default router;
