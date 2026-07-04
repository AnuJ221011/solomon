import { Router } from 'express';
import { verifyWebhook, receiveWebhook, startBroadcast, getBroadcasts, getBroadcast } from './whatsapp.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';

const router = Router();

// ── Public — Meta webhook (no auth) ──────────────────────────────────────────
router.get('/webhook', verifyWebhook);
router.post('/webhook', receiveWebhook);

// ── Admin only ────────────────────────────────────────────────────────────────
router.use(authenticate, authorize('ADMIN'));
router.post('/broadcast', startBroadcast);
router.get('/broadcasts', getBroadcasts);
router.get('/broadcasts/:id', getBroadcast);

export default router;
