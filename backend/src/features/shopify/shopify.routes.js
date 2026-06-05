import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import * as shopifyService from './shopify.service.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { logger } from '../../shared/utils/logger.js';

const router = Router();

const connectSchema = z.object({
  shopDomain: z.string().min(1).regex(/\.myshopify\.com$/, 'Must be a .myshopify.com domain'),
  accessToken: z.string().min(1),
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

// Shopify webhook receiver (no auth — verified by topic + shop domain)
router.post('/webhook', async (req, res) => {
  const topic = req.headers['x-shopify-topic'];
  const shopDomain = req.headers['x-shopify-shop-domain'];

  logger.info('Shopify webhook received', { topic, shopDomain });

  try {
    if (topic === 'products/update') await shopifyService.handleProductUpdate(shopDomain, req.body);
    if (topic === 'inventory_levels/update') await shopifyService.handleInventoryUpdate(shopDomain, req.body);
  } catch (err) {
    logger.error('Shopify webhook handler error', { topic, error: err.message });
  }

  // Always 200 to Shopify
  res.status(200).json({ received: true });
});

export default router;
