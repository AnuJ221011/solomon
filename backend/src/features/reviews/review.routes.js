import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate, validateQuery } from '../../shared/middleware/validate.js';
import { createReview, respondToReview, editReview, listProductReviews } from './review.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

const router = Router();

const createSchema = z.object({
  orderId: z.string().min(1),
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

const respondSchema = z.object({ brandResponse: z.string().min(1).max(1000) });
const editSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
});
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// Public — list reviews for a product
router.get('/product/:productId', validateQuery(querySchema), async (req, res) => {
  const result = await listProductReviews(req.params.productId, req.query);
  sendSuccess(res, result);
});

// Buyer
router.post('/', authenticate, authorize('BUYER'), validate(createSchema), async (req, res) => {
  const review = await createReview(req.user.id, req.body);
  sendSuccess(res, review, 'Review submitted, thank you!', 201);
});

router.patch('/:id', authenticate, authorize('BUYER'), validate(editSchema), async (req, res) => {
  const review = await editReview(req.user.id, req.params.id, req.body);
  sendSuccess(res, review, 'Review updated successfully.');
});

// Brand
router.post('/:id/respond', authenticate, authorize('BRAND'), validate(respondSchema), async (req, res) => {
  const review = await respondToReview(req.user.id, req.params.id, req.body.brandResponse);
  sendSuccess(res, review, 'Brand response posted to review.');
});

export default router;
