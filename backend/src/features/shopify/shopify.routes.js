import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import * as shopifyService from './shopify.service.js';
import prisma from '../../config/db.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { logger } from '../../shared/utils/logger.js';

const router = Router();

const connectSchema = z.object({
  shopDomain: z.string().min(1).regex(/\.myshopify\.com$/, 'Must be a .myshopify.com domain'),
  accessToken: z.string().min(1),
  // The custom app's webhook signing secret (Shopify Admin → App → API credentials).
  // Optional — without it, webhooks from this store are accepted unverified.
  webhookSecret: z.string().min(1).optional(),
});

// Brand — store management
router.get('/store', authenticate, authorize('BRAND'), async (req, res) => {
  const store = await shopifyService.getStore(req.user.id);
  sendSuccess(res, store);
});

router.post('/store/connect', authenticate, authorize('BRAND'), validate(connectSchema), async (req, res) => {
  const store = await shopifyService.connectStore(req.user.id, req.body);
  sendSuccess(res, store, 'Shopify store connected');
});

router.delete('/store/disconnect', authenticate, authorize('BRAND'), async (req, res) => {
  await shopifyService.disconnectStore(req.user.id);
  sendSuccess(res, null, 'Shopify store disconnected');
});

// Import products from connected Shopify store
router.post('/import-products', authenticate, authorize('BRAND'), async (req, res) => {
  const result = await shopifyService.importProductsFromShopify(req.user.id);
  sendSuccess(res, result, `Import complete: ${result.imported} products imported`);
});

// Shopify webhook receiver — verified via X-Shopify-Hmac-Sha256 when the
// connected store has a webhook secret on file (see app.js for the raw-body
// capture this depends on).
router.post('/webhook', async (req, res) => {
  const topic = req.headers['x-shopify-topic'];
  const shopDomain = req.headers['x-shopify-shop-domain'];

  logger.info('Shopify webhook received', { topic, shopDomain });

  try {
    const store = shopDomain
      ? await prisma.shopifyStore.findUnique({ where: { shopDomain } })
      : null;

    if (store?.webhookSecret) {
      const signature = req.headers['x-shopify-hmac-sha256'] ?? '';
      const expected = crypto
        .createHmac('sha256', store.webhookSecret)
        .update(req.rawBody ?? Buffer.from(''))
        .digest('base64');
      const sigBuf = Buffer.from(signature, 'base64');
      const expectedBuf = Buffer.from(expected, 'base64');
      const valid = sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf);
      if (!valid) {
        logger.warn('Shopify webhook: signature mismatch — ignoring payload', { shopDomain, topic });
        return res.status(401).json({ received: false });
      }
    } else {
      logger.warn('Shopify webhook: no webhook secret on file for this store — accepting unverified', { shopDomain });
    }

    if (topic === 'products/update') await shopifyService.handleProductUpdate(shopDomain, req.body);
    if (topic === 'inventory_levels/update') await shopifyService.handleInventoryUpdate(shopDomain, req.body);
  } catch (err) {
    logger.error('Shopify webhook handler error', { topic, error: err.message });
  }

  // Always 200 to Shopify once verified
  res.status(200).json({ received: true });
});

export default router;
