import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireVerified } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import * as paymentService from './payment.service.js';
import { verifyWebhookSignature } from './paypal.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';
import { logger } from '../../shared/utils/logger.js';

const router = Router();

const initiateSchema = z.object({
  countryCode: z.string().length(2),
  walletCreditsToApplyInr: z.number().min(0).default(0),
});

const captureSchema = z.object({
  paypalOrderId: z.string().min(1),
  shippingAddress: z.object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    postalCode: z.string().min(1),
    countryCode: z.string().length(2),
  }),
  walletCreditsToApplyInr: z.number().min(0).default(0),
});

// Buyer — get cart totals before initiating payment
router.get(
  '/paypal/cart-total',
  requireVerified,
  authorize('BUYER'),
  async (req, res) => {
    const countryCode = req.query.countryCode ?? req.user.buyerProfile?.countryCode ?? 'US';
    const totals = await paymentService.calculateCartTotal(req.user.id, countryCode);
    sendSuccess(res, totals);
  }
);

// Buyer — create a PayPal order (step 1: get approval URL)
router.post(
  '/paypal/create-order',
  requireVerified,
  authorize('BUYER'),
  validate(initiateSchema),
  async (req, res) => {
    const result = await paymentService.initiatePayPalPayment(req.user.id, req.body);
    sendSuccess(res, result, 'PayPal checkout session created.');
  }
);

// Buyer — capture payment and fulfil platform orders (step 2: after buyer approval)
router.post(
  '/paypal/capture',
  requireVerified,
  authorize('BUYER'),
  validate(captureSchema),
  async (req, res) => {
    const result = await paymentService.captureAndFulfil(req.user.id, req.body);
    sendSuccess(res, result, 'Payment captured, orders confirmed.', 201);
  }
);

// PayPal webhook — raw body needed for signature verification
router.post('/paypal/webhook', async (req, res) => {
  try {
    const verification = await verifyWebhookSignature({
      headers: req.headers,
      body: req.body,
    });

    if (verification?.verification_status !== 'SUCCESS' && process.env.NODE_ENV === 'production') {
      return sendError(res, 'Webhook signature verification failed', 400);
    }

    const event = req.body;
    logger.info('PayPal webhook received', { eventType: event.event_type, resourceId: event.resource?.id });

    // Handle PAYMENT.CAPTURE.COMPLETED — update order status if needed
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const captureId = event.resource?.id;
      if (captureId) {
        // Orders are already created in the capture endpoint; this is a backup confirmation
        logger.info('PayPal capture confirmed via webhook', { captureId });
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error('PayPal webhook handler error', { error: err.message });
    res.status(200).json({ received: true }); // Always 200 to PayPal
  }
});

export default router;
