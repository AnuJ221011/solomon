import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireVerified } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate } from '../../shared/middleware/validate.js';
import * as buyerService from './buyer.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

const router = Router();

const updateProfileSchema = z.object({
  businessName:      z.string().min(1).optional(),
  phone:             z.string().optional(),
  addressLine:       z.string().optional(),
  city:              z.string().optional(),
  state:             z.string().optional(),
  postalCode:        z.string().optional(),
  countryCode:       z.string().optional(),
  preferredCurrency: z.string().length(3).optional(),
  storeType:         z.string().optional(),
  notifNewArrivals:  z.boolean().optional(),
  notifOrderUpdates: z.boolean().optional(),
  notifPromotions:   z.boolean().optional(),
});

const cartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),  // required for products that have variants
  quantity: z.number().int().positive(),
});

// All buyer routes require authentication
router.use(authenticate, authorize('BUYER'));

// Profile
router.get('/profile', async (req, res) => {
  const data = await buyerService.getProfile(req.user.id);
  sendSuccess(res, data);
});

router.patch('/profile', requireVerified, validate(updateProfileSchema), async (req, res) => {
  const data = await buyerService.updateProfile(req.user.id, req.body);
  sendSuccess(res, data, 'Profile updated successfully.');
});

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
  const variantId = req.query.variantId;
  await buyerService.removeCartItem(req.user.id, req.params.productId, variantId);
  sendSuccess(res, null, 'Item removed from your cart.');
});

router.delete('/cart', requireVerified, async (req, res) => {
  await buyerService.clearCart(req.user.id);
  sendSuccess(res, null, 'Your cart is now empty.');
});

// Saved items
router.get('/saved', async (req, res) => {
  const saved = await buyerService.getSavedItems(req.user.id);
  sendSuccess(res, saved);
});

router.post('/saved/product/:productId', requireVerified, async (req, res) => {
  await buyerService.saveProduct(req.user.id, req.params.productId);
  sendSuccess(res, null, 'Product saved to your wishlist.');
});

router.delete('/saved/product/:productId', async (req, res) => {
  await buyerService.unsaveProduct(req.user.id, req.params.productId);
  sendSuccess(res, null, 'Product removed from your wishlist.');
});

router.post('/saved/brand/:brandProfileId', requireVerified, async (req, res) => {
  await buyerService.saveBrand(req.user.id, req.params.brandProfileId);
  sendSuccess(res, null, 'Brand added to your saved list.');
});

router.delete('/saved/brand/:brandProfileId', async (req, res) => {
  await buyerService.unsaveBrand(req.user.id, req.params.brandProfileId);
  sendSuccess(res, null, 'Brand removed from saved list.');
});

export default router;
