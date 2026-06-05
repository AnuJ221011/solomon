import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { requestReturn, updateReturnStatus, listReturns } from './return.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

const router = Router();

const requestReturnSchema = z.object({
  reason: z.string().min(10),
  photoUrls: z.array(z.string().url()).max(5).default([]),
});

const updateStatusSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'LABEL_ISSUED', 'RECEIVED', 'REFUNDED']),
  adminNotes: z.string().optional(),
  returnLabelUrl: z.string().url().optional(),
});

// Buyer — request a return
router.post('/order/:orderId', authenticate, authorize('BUYER'), validate(requestReturnSchema), async (req, res) => {
  const ret = await requestReturn(req.user.id, req.params.orderId, req.body);
  sendSuccess(res, ret, 'Return requested', 201);
});

// Admin — list and update returns
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
  const result = await listReturns(req.query);
  sendSuccess(res, result);
});

router.patch('/:id/status', authenticate, authorize('ADMIN'), validate(updateStatusSchema), async (req, res) => {
  const ret = await updateReturnStatus(req.user.id, req.params.id, req.body);
  sendSuccess(res, ret, 'Return status updated');
});

export default router;
