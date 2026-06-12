import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import { upsertShippingRateSchema } from './shipping.validator.js';
import { upsertShippingRate, getShippingRates } from './shipping.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

const router = Router();

router.get('/', authenticate, authorize('BRAND'), async (req, res) => {
  const rates = await getShippingRates(req.user.id);
  sendSuccess(res, rates);
});

router.put('/zone', authenticate, authorize('BRAND'), validate(upsertShippingRateSchema), async (req, res) => {
  const rate = await upsertShippingRate(req.user.id, req.body);
  sendSuccess(res, rate, 'Shipping rate saved for this zone.');
});

export default router;
