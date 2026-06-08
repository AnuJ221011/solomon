import { Router } from 'express';
import * as ctrl from './product.controller.js';
import { authenticate, optionalAuthenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate, validateQuery } from '../../shared/middleware/validate.js';
import { createProductSchema, updateProductSchema, productQuerySchema } from './product.validator.js';
import { importProductsFromCsv } from './product.import.js';
import variantRouter from './variant.routes.js';
import { sendSuccess } from '../../shared/utils/response.js';
import multer from 'multer';

const router = Router();

// Public — optionally attaches req.user for personalised ranking
router.get('/', optionalAuthenticate, validateQuery(productQuerySchema), ctrl.listProducts);
router.get('/:slug', ctrl.getProduct);

// Brand-only
router.get('/me/listings', authenticate, authorize('BRAND'), validateQuery(productQuerySchema), ctrl.listMyProducts);
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

// Variant sub-routes: /api/products/:productId/variants
router.use('/:productId/variants', variantRouter);

export default router;
