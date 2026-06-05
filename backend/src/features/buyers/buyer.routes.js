import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireVerified } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import * as buyerService from './buyer.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

const router = Router();

const cartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
  variantOptions: z.any().optional(),
});

// All buyer routes require authentication
router.use(authenticate, authorize('BUYER'));

// Dashboard
router.get('/dashboard', async (req, res) => {
  const data = await buyerService.getBuyerDashboard(req.user.id);
  sendSuccess(res, data);
});

// Cart
router.get('/cart', async (req, res) => {
  const cart = await buyerService.getCart(req.user.id);
  sendSuccess(res, cart);
});

router.put('/cart/item', requireVerified, validate(cartItemSchema), async (req, res) => {
  const item = await buyerService.upsertCartItem(req.user.id, req.body);
  sendSuccess(res, item);
});

router.delete('/cart/item/:productId', requireVerified, async (req, res) => {
  await buyerService.removeCartItem(req.user.id, req.params.productId);
  sendSuccess(res, null, 'Item removed');
});

router.delete('/cart', requireVerified, async (req, res) => {
  await buyerService.clearCart(req.user.id);
  sendSuccess(res, null, 'Cart cleared');
});

// Saved items
router.get('/saved', async (req, res) => {
  const saved = await buyerService.getSavedItems(req.user.id);
  sendSuccess(res, saved);
});

router.post('/saved/product/:productId', requireVerified, async (req, res) => {
  await buyerService.saveProduct(req.user.id, req.params.productId);
  sendSuccess(res, null, 'Product saved');
});

router.delete('/saved/product/:productId', async (req, res) => {
  await buyerService.unsaveProduct(req.user.id, req.params.productId);
  sendSuccess(res, null, 'Product unsaved');
});

router.post('/saved/brand/:brandProfileId', requireVerified, async (req, res) => {
  await buyerService.saveBrand(req.user.id, req.params.brandProfileId);
  sendSuccess(res, null, 'Brand saved');
});

router.delete('/saved/brand/:brandProfileId', async (req, res) => {
  await buyerService.unsaveBrand(req.user.id, req.params.brandProfileId);
  sendSuccess(res, null, 'Brand unsaved');
});

export default router;
