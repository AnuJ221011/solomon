import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { getWallet, getReferralStats, getLeaderboard } from './referral.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

const router = Router();

router.get('/link', authenticate, authorize('BUYER'), async (req, res) => {
  const data = await getReferralStats(req.user.id);
  sendSuccess(res, data);
});

router.get('/wallet', authenticate, authorize('BUYER'), async (req, res) => {
  const wallet = await getWallet(req.user.id);
  sendSuccess(res, wallet);
});

// Leaderboard — top referrers this month with buyer's rank context
router.get('/leaderboard', authenticate, authorize('BUYER'), async (req, res) => {
  const data = await getLeaderboard(req.user.id);
  sendSuccess(res, data);
});

export default router;
