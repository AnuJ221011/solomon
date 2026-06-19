import { Router } from 'express';
import prisma from '../../config/db.js';
import * as ctrl from './product.controller.js';
import { authenticate, optionalAuthenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate, validateQuery } from '../../shared/middleware/validate.js';
import { createProductSchema, updateProductSchema, productQuerySchema } from './product.validator.js';
import { importProductsFromCsv, importProductsFromJson } from './product.import.js';
import variantRouter from './variant.routes.js';
import { sendSuccess } from '../../shared/utils/response.js';
import multer from 'multer';

const router = Router();

// Public — optionally attaches req.user for personalised ranking
router.get('/', optionalAuthenticate, validateQuery(productQuerySchema), ctrl.listProducts);
router.get('/:slug', ctrl.getProduct);

// Brand-only
router.get('/me/listings', authenticate, authorize('BRAND'), ctrl.listMyProducts);

// CSV export — must be before /:slug
router.get('/me/export-csv', authenticate, authorize('BRAND'), async (req, res) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.user.id } });
  if (!brand) throw new Error('Brand profile not found');

  const products = await prisma.product.findMany({
    where: { brandProfileId: brand.id },
    include: { variants: { include: { attributes: true }, orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  const q = (s) => `"${(s ?? '').toString().replace(/"/g, '""')}"`;
  const header = 'name,description,wholesale_price_inr,moq,weight_grams,lead_time,shipping_zones,categories,tags,hs_tariff_code,country_of_origin,variant_sku,variant_attributes,variant_price_inr,variant_stock';

  const rows = [];
  for (const p of products) {
    const base = [
      q(p.name),
      q(p.description),
      p.wholesalePriceInr,
      p.moq,
      p.weightGrams,
      (p.leadTime ?? '').toLowerCase(),
      (p.enabledZones ?? []).join('|'),
      (p.categories ?? []).join('|'),
      (p.tags ?? []).join('|'),
      p.hsTariffCode ?? '',
      p.countryOfOrigin ?? 'IN',
    ];

    if (p.variants.length === 0) {
      rows.push([...base, '', '', '', ''].join(','));
    } else {
      for (const v of p.variants) {
        const attrs = v.attributes.map((a) => `${a.name}:${a.value}`).join('|');
        rows.push([...base, v.sku, attrs, Number(v.priceInr), v.stock].join(','));
      }
    }
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="products_${Date.now()}.csv"`);
  res.send(header + '\n' + rows.join('\n'));
});

router.post('/', authenticate, authorize('BRAND'), validate(createProductSchema), ctrl.createProduct);
router.patch('/:id', authenticate, authorize('BRAND'), validate(updateProductSchema), ctrl.updateProduct);
router.delete('/:id', authenticate, authorize('BRAND'), ctrl.deleteProduct);

// CSV bulk import (L3 Trusted+ only — enforced by achievement level check in service)
const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
router.post(
  '/bulk-import',
  authenticate,
  authorize('BRAND'),
  (req, res, next) => csvUpload.single('file')(req, res, (err) => err ? next(err) : next()),
  async (req, res) => {
    if (!req.file) throw new Error('No CSV file uploaded');
    const csvText = req.file.buffer.toString('utf-8');
    const result = await importProductsFromCsv(req.user.id, csvText);
    sendSuccess(res, result, `Import complete: ${result.created} created, ${result.skipped} skipped`);
  }
);

// CSV import wizard — accepts pre-parsed products + unmatched category names.
// Gemini classifies unmatched categories and creates missing L1/L2/L3 nodes before inserting.
router.post('/import-shopify', authenticate, authorize('BRAND'), async (req, res) => {
  const { products, unmatchedCategories = [] } = req.body;
  const result = await importProductsFromJson(req.user.id, products, unmatchedCategories);
  sendSuccess(res, result, `Import complete: ${result.created} created, ${result.skipped} skipped`);
});

// Variant sub-routes: /api/products/:productId/variants
router.use('/:productId/variants', variantRouter);

export default router;
