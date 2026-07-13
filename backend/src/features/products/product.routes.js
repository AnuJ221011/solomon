import { Router } from 'express';
import prisma from '../../config/db.js';
import * as ctrl from './product.controller.js';
import { authenticate, optionalAuthenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate, validateQuery } from '../../shared/middleware/validate.js';
import { requireApprovedBrand } from '../../shared/middleware/requireApprovedBrand.js';
import { createProductSchema, updateProductSchema, productQuerySchema } from './product.validator.js';
import { importProductsFromCsv, importProductsFromJson } from './product.import.js';
import variantRouter from './variant.routes.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { createError } from '../../shared/utils/createError.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';
import { env } from '../../config/env.js';

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

router.post('/', authenticate, authorize('BRAND'), requireApprovedBrand, validate(createProductSchema), ctrl.createProduct);
router.patch('/:id', authenticate, authorize('BRAND'), requireApprovedBrand, validate(updateProductSchema), ctrl.updateProduct);
router.delete('/:id', authenticate, authorize('BRAND'), requireApprovedBrand, ctrl.deleteProduct);

// CSV bulk import (L3 Trusted+ only — enforced by achievement level check in service)
const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
router.post(
  '/bulk-import',
  authenticate,
  authorize('BRAND'),
  requireApprovedBrand,
  (req, res, next) => csvUpload.single('file')(req, res, (err) => err ? next(err) : next()),
  async (req, res) => {
    if (!req.file) throw new Error('No CSV file uploaded');
    const csvText = req.file.buffer.toString('utf-8');
    const result = await importProductsFromCsv(req.user.id, csvText);
    sendSuccess(res, result, `Import complete: ${result.created} created, ${result.skipped} skipped`);
  }
);

// CSV import wizard — accepts pre-parsed products. Any category that doesn't
// match the existing taxonomy falls back to "Other" (categories are never
// created ad-hoc from imports — see product.import.js).
router.post('/import-shopify', authenticate, authorize('BRAND'), async (req, res) => {
  const { products } = req.body;
  const result = await importProductsFromJson(req.user.id, products);
  sendSuccess(res, result, `Import complete: ${result.created} created, ${result.skipped} skipped`);
});

// AI content polishing — clean up name, description, tags using Gemini
router.post('/ai/polish', authenticate, async (req, res) => {
  const { field, value } = req.body;
  if (!field || !value?.trim()) return sendSuccess(res, { cleaned: value ?? '' });

  const allowed = ['name', 'description', 'tags', 'brandStory'];
  if (!allowed.includes(field)) throw createError('Invalid field', 400);
  if (!env.GEMINI_API_KEY) throw createError('AI polishing is not configured', 503);

  const PROMPTS = {
    name: `You are a proofreader for a B2B wholesale marketplace selling Indian artisan goods.
Correct this product name — fix it, don't rewrite it:
- Fix spelling, grammar, and capitalisation mistakes only
- Use Title Case
- Strip all HTML tags and markup (e.g. <h1>, <p>, <div>, <b>) — return plain text only, no tags of any kind
- Remove emojis, stray symbols, and repeated punctuation (keep hyphens if part of the name)
- Collapse extra whitespace
- Keep the author's own words and word order — do NOT rephrase, reword, or substitute synonyms for anything that is already correct
- Do NOT add or invent any words, materials, or details that aren't in the original
- Max 80 characters — only shorten if it's already over, cutting at a natural word boundary

Return ONLY the corrected name, no explanation.

Input: "${value}"`,

    description: `You are a proofreader for a B2B wholesale marketplace selling Indian artisan goods.
Correct this product description — fix it, don't rewrite it:
- Fix every spelling, grammar, and punctuation mistake so each sentence is grammatically correct
- Strip all HTML tags and markup (e.g. <h1>, <p>, <div>, <b>) — return plain text only, no tags of any kind
- Remove emojis, stray symbols, and repeated punctuation
- Fix spacing: collapse multiple blank lines to one, remove trailing spaces
- Standardise bullet points to a single style ("-") if any are used
- Keep the author's own words, sentence order, and level of detail — do NOT rephrase sentences that are already correct, do NOT add adjectives or marketing language that isn't there, do NOT remove or reorganise content
- Do NOT add, remove, or invent any factual claims (materials, dimensions, origin, etc.)
- The result should read as the same description, just correctly written

Return ONLY the corrected description, no explanation.

Input:
${value}`,

    tags: `You are cleaning up product tags for a B2B wholesale marketplace.
Correct this list of tags — fix each one, don't replace it with a different word:
- Fix spelling mistakes in each tag
- Lowercase everything
- Strip any HTML tags or markup from each tag — return plain text only
- Remove emojis and special characters from each tag
- Trim whitespace around each tag
- Split any tag that's really multiple keywords crammed together
- Remove exact and near-duplicate tags (case-insensitive, singular/plural)
- Keep at most 10 tags — keep the most relevant/specific ones if trimming
- Do NOT add new tags that aren't implied by the input
- Return as comma-separated values only

Return ONLY the comma-separated tags, no explanation.

Input: "${value}"`,

    brandStory: `You are a proofreader for a B2B wholesale marketplace selling Indian artisan goods.
Correct this brand story — fix it, don't rewrite it:
- Fix every spelling, grammar, and punctuation mistake so each sentence is grammatically correct
- Strip all HTML tags and markup (e.g. <h1>, <p>, <div>, <b>) — return plain text only, no tags of any kind
- Remove emojis, stray symbols, and repeated punctuation
- Fix spacing: collapse multiple blank lines to one, remove trailing spaces
- Keep the author's own words, sentence order, and personal voice — do NOT rephrase sentences that are already correct, do NOT add flourishes or "polish" the tone, do NOT remove or reorganise content
- Do NOT add, remove, or invent any factual claims that aren't already present
- The result should read as the same story, just correctly written
- Max 1000 characters — only shorten if it's already over, cutting at a natural sentence boundary

Return ONLY the corrected brand story, no explanation.

Input:
${value}`,
  };

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  const result = await model.generateContent(PROMPTS[field]);
  // Belt-and-braces: strip any HTML tags the model leaves behind despite the
  // prompt instruction, so markup can never make it into stored content.
  const cleaned = result.response.text().trim().replace(/<[^>]*>/g, '').trim();

  sendSuccess(res, { cleaned });
});

// Variant sub-routes: /api/products/:productId/variants
router.use('/:productId/variants', variantRouter);

export default router;
