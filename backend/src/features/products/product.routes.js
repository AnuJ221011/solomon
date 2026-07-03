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
import { createError } from '../../shared/utils/createError.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

// AI content polishing — clean up name, description, tags using Gemini
router.post('/ai/polish', authenticate, authorize('BRAND'), async (req, res) => {
  const { field, value } = req.body;
  if (!field || !value?.trim()) return sendSuccess(res, { cleaned: value ?? '' });

  const allowed = ['name', 'description', 'tags'];
  if (!allowed.includes(field)) throw createError('Invalid field', 400);
  if (!process.env.GEMINI_API_KEY) throw createError('AI polishing is not configured', 503);

  const PROMPTS = {
    name: `You are a product content editor for a B2B wholesale marketplace selling Indian artisan goods.
Clean up this product name:
- Use Title Case capitalisation
- Remove emojis and special characters (keep hyphens if part of the name)
- Collapse extra whitespace
- Max 80 characters — truncate at a natural word boundary if needed
- Do NOT add words or invent details

Return ONLY the cleaned name, no explanation.

Input: "${value}"`,

    description: `You are a product content editor for a B2B wholesale marketplace selling Indian artisan goods.
Polish this product description for wholesale buyers:
- Remove excessive emojis (keep at most 1–2 if they genuinely help)
- Fix irregular spacing: collapse multiple blank lines to one, remove trailing spaces
- Standardise bullet points to a single style (use "-" if mixed)
- Do NOT add, remove, or change any factual information
- Keep the tone professional and easy to scan

Return ONLY the cleaned description, no explanation.

Input:
${value}`,

    tags: `Clean up these product tags for a wholesale marketplace:
- Lowercase everything
- Remove emojis and special characters from each tag
- Trim whitespace around each tag
- Remove exact duplicates (case-insensitive)
- Keep at most 10 tags (drop extras from the end)
- Return as comma-separated values only

Return ONLY the comma-separated tags, no explanation.

Input: "${value}"`,
  };

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(PROMPTS[field]);
  const cleaned = result.response.text().trim();

  sendSuccess(res, { cleaned });
});

// Variant sub-routes: /api/products/:productId/variants
router.use('/:productId/variants', variantRouter);

export default router;
