import { Router } from 'express';
import * as ctrl from './order.controller.js';
import { authenticate, requireVerified } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate, validateQuery } from '../../shared/middleware/validate.js';
import {
  createOrdersFromCartSchema,
  updateOrderStatusSchema,
  createManualOrderSchema,
  orderQuerySchema,
} from './order.validator.js';

const router = Router();

// Buyer — checkout converts cart into orders
router.post('/checkout', requireVerified, authorize('BUYER'), validate(createOrdersFromCartSchema), ctrl.checkout);
router.get('/my', authenticate, authorize('BUYER'), validateQuery(orderQuerySchema), ctrl.listMyBuyerOrders);

// Brand — manage incoming orders
router.get('/brand', authenticate, authorize('BRAND'), validateQuery(orderQuerySchema), ctrl.listMyBrandOrders);
router.post('/brand/manual', authenticate, authorize('BRAND'), validate(createManualOrderSchema), ctrl.createManualOrder);
router.patch('/brand/:id/status', authenticate, authorize('BRAND'), validate(updateOrderStatusSchema), ctrl.updateStatus);

// Shared — both buyer and brand can view an order
router.get('/:id', authenticate, ctrl.getOrder);

export default router;
