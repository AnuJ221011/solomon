import { Router } from 'express';
import { getCurrentRates } from './fx.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

const router = Router();

// Public — frontend uses this to get current display rates
router.get('/rates', async (req, res) => {
  const rates = await getCurrentRates().catch(() => null);
  sendSuccess(res, { rates, available: rates !== null });
});

export default router;
