import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { sendSuccess } from '../../shared/utils/response.js';
import * as variantService from './variant.service.js';

const router = Router({ mergeParams: true }); // inherits :productId from parent router

// ── Validation schemas ────────────────────────────────────────────────────────

const attributeSchema = z.object({
  name: z.string().min(1).max(50),   // e.g. "Color", "Size"
  value: z.string().min(1).max(100), // e.g. "Red", "L"
});

const createVariantSchema = z.object({
  sku: z.string().min(1).max(100),
  priceInr: z.number().positive(),
  compareAtPriceInr: z.number().positive().optional(),
  stock: z.number().int().min(0).default(0),
  imageUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']).default('ACTIVE'),
  attributes: z.array(attributeSchema).min(1),
});

const bulkCreateSchema = z.object({
  variants: z.array(createVariantSchema).min(1).max(100),
});

const updateVariantSchema = createVariantSchema.partial();

const stockSchema = z.object({
  stock: z.number().int().min(0).optional(),
  delta: z.number().int().optional(),
}).refine((d) => d.stock !== undefined || d.delta !== undefined, {
  message: 'Provide either stock (absolute) or delta (relative)',
});

// ── Public route ──────────────────────────────────────────────────────────────

// GET /api/products/:productId/variants — anyone can fetch variants for a product
router.get('/', async (req, res) => {
  const variants = await variantService.getVariantsByProduct(req.params.productId);
  sendSuccess(res, variants);
});

router.get('/:variantId', async (req, res) => {
  const variant = await variantService.getVariantById(req.params.variantId);
  sendSuccess(res, variant);
});

// ── Brand-only routes ─────────────────────────────────────────────────────────

// Create a single variant
router.post('/',
  authenticate, authorize('BRAND'),
  validate(createVariantSchema),
  async (req, res) => {
    const variant = await variantService.createVariant(
      req.user.id, req.params.productId, req.body
    );
    sendSuccess(res, variant, 'Variant created', 201);
  }
);

// Bulk-create variants (combination generator)
router.post('/bulk',
  authenticate, authorize('BRAND'),
  validate(bulkCreateSchema),
  async (req, res) => {
    const variants = await variantService.createVariantsBulk(
      req.user.id, req.params.productId, req.body.variants
    );
    sendSuccess(res, variants, `${variants.length} variants created`, 201);
  }
);

// Update a variant
router.patch('/:variantId',
  authenticate, authorize('BRAND'),
  validate(updateVariantSchema),
  async (req, res) => {
    const variant = await variantService.updateVariant(
      req.user.id, req.params.productId, req.params.variantId, req.body
    );
    sendSuccess(res, variant, 'Variant updated');
  }
);

// Update stock (dedicated endpoint for inventory management)
router.patch('/:variantId/stock',
  authenticate, authorize('BRAND'),
  validate(stockSchema),
  async (req, res) => {
    const variant = await variantService.updateStock(
      req.user.id, req.params.productId, req.params.variantId, req.body
    );
    sendSuccess(res, variant, 'Stock updated');
  }
);

// Delete a variant
router.delete('/:variantId',
  authenticate, authorize('BRAND'),
  async (req, res) => {
    await variantService.deleteVariant(
      req.user.id, req.params.productId, req.params.variantId
    );
    sendSuccess(res, null, 'Variant deleted');
  }
);

export default router;
