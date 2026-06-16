import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate, validateQuery } from '../../shared/middleware/validate.js';
import * as adminService from './admin.service.js';
import { sendWeeklyDigests } from '../scheduler/digest.service.js';
import { sendSuccess } from '../../shared/utils/response.js';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate, authorize('ADMIN'));

// ── Platform stats ─────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  const stats = await adminService.getPlatformStats();
  sendSuccess(res, stats);
});

// ── Brand management ───────────────────────────────────────────────────────
router.get('/brands/pending', async (req, res) => {
  const brands = await adminService.getPendingBrands();
  sendSuccess(res, brands);
});

router.get('/brands/approved', async (req, res) => {
  const brands = await adminService.getApprovedBrands();
  sendSuccess(res, brands);
});

router.get('/brands/:id', async (req, res) => {
  const brand = await adminService.getBrandById(req.params.id);
  sendSuccess(res, brand);
});

router.post('/brands/:id/approve', async (req, res) => {
  const brand = await adminService.approveBrand(req.params.id);
  sendSuccess(res, brand, 'Brand approved and is now live.');
});

router.post('/brands/:id/reject', async (req, res) => {
  const brand = await adminService.rejectBrand(req.params.id);
  sendSuccess(res, brand, 'Brand application has been rejected.');
});

router.post('/brands/:id/level', validate(z.object({ level: z.string() })), async (req, res) => {
  const brand = await adminService.overrideAchievementLevel(req.params.id, req.body.level);
  sendSuccess(res, brand, 'Achievement level overridden by admin.');
});

// ── User management ────────────────────────────────────────────────────────
const usersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['BUYER', 'BRAND', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
});

router.get('/users/export', async (req, res) => {
  const csv = await adminService.getUsersCsv();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="users_${Date.now()}.csv"`);
  res.send(csv);
});

router.get('/users', validateQuery(usersQuerySchema), async (req, res) => {
  const result = await adminService.listUsers(req.query);
  sendSuccess(res, result);
});

router.post('/users/:id/suspend', async (req, res) => {
  const user = await adminService.suspendUser(req.params.id);
  sendSuccess(res, user, 'User account has been suspended.');
});

router.post('/users/:id/reactivate', async (req, res) => {
  const user = await adminService.reactivateUser(req.params.id);
  sendSuccess(res, user, 'User account is now active.');
});

// ── Payout management ──────────────────────────────────────────────────────
const payoutQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  isPaid: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  brandId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

router.get('/payouts', validateQuery(payoutQuerySchema), async (req, res) => {
  const result = await adminService.listPayouts(req.query);
  sendSuccess(res, result);
});

// CSV export for pending or paid payouts
router.get('/payouts/export', async (req, res) => {
  const isPaid = req.query.isPaid === 'true';
  const csv = await adminService.getPayoutsCsv(isPaid);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="payouts_${isPaid ? 'paid' : 'pending'}_${Date.now()}.csv"`);
  res.send(csv);
});

router.post('/payouts/:id/mark-paid',
  validate(z.object({ paypalBatchId: z.string().optional() })),
  async (req, res) => {
    const payout = await adminService.markPayoutPaid(req.params.id, req.body);
    sendSuccess(res, payout, 'Payout marked as paid successfully.');
  }
);

router.post('/payouts/bulk-paid',
  validate(z.object({
    payoutIds: z.array(z.string()).min(1),
    paypalBatchId: z.string().optional(),
  })),
  async (req, res) => {
    const result = await adminService.markBulkPayoutsPaid(req.body.payoutIds, req.body.paypalBatchId);
    sendSuccess(res, result, `${result.count} payouts marked as paid`);
  }
);

// ── Disputes ───────────────────────────────────────────────────────────────
const disputeQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['OPEN', 'RESOLVED', 'CLOSED']).optional(),
});

router.get('/disputes', validateQuery(disputeQuerySchema), async (req, res) => {
  const result = await adminService.listDisputes(req.query);
  sendSuccess(res, result);
});

router.post('/disputes/:id/resolve', async (req, res) => {
  const order = await adminService.resolveDispute(req.params.id);
  sendSuccess(res, order, 'Dispute resolved.');
});

router.post('/disputes/:id/close', async (req, res) => {
  const order = await adminService.closeDispute(req.params.id);
  sendSuccess(res, order, 'Dispute closed.');
});

// ── Products (platform-wide) ───────────────────────────────────────────────
const productsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  brandId: z.string().optional(),
  availability: z.enum(['ACTIVE', 'INACTIVE', 'COMING_SOON']).optional(),
});

router.get('/products', validateQuery(productsQuerySchema), async (req, res) => {
  const result = await adminService.listProducts(req.query);
  sendSuccess(res, result);
});

// ── Returns ────────────────────────────────────────────────────────────────
const returnsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['REQUESTED', 'APPROVED', 'REJECTED', 'LABEL_ISSUED', 'RECEIVED', 'REFUNDED']).optional(),
});

router.get('/returns', validateQuery(returnsQuerySchema), async (req, res) => {
  const result = await adminService.listReturns(req.query);
  sendSuccess(res, result);
});

router.post('/returns/:id/approve', async (req, res) => {
  const ret = await adminService.approveReturn(req.params.id);
  sendSuccess(res, ret, 'Return approved.');
});

router.post('/returns/:id/reject',
  validate(z.object({ adminNotes: z.string().optional() })),
  async (req, res) => {
    const ret = await adminService.rejectReturn(req.params.id, req.body.adminNotes);
    sendSuccess(res, ret, 'Return rejected.');
  }
);

router.post('/returns/:id/refund', async (req, res) => {
  const ret = await adminService.refundReturn(req.params.id);
  sendSuccess(res, ret, 'Return marked as refunded.');
});

router.post('/returns/:id/issue-label',
  validate(z.object({ returnLabelUrl: z.string().url().optional() })),
  async (req, res) => {
    const ret = await adminService.issueReturnLabel(req.params.id, req.body.returnLabelUrl);
    sendSuccess(res, ret, 'Return label issued.');
  }
);

// ── Revenue over time ──────────────────────────────────────────────────────
router.get('/stats/revenue', validateQuery(z.object({
  days: z.coerce.number().int().min(7).max(365).default(30),
})), async (req, res) => {
  const data = await adminService.getRevenueOverTime({ days: Number(req.query.days) });
  sendSuccess(res, data);
});

// ── Low stock ──────────────────────────────────────────────────────────────
router.get('/inventory/low-stock', validateQuery(z.object({
  threshold: z.coerce.number().int().min(0).max(100).default(10),
})), async (req, res) => {
  const data = await adminService.getLowStockVariants({ threshold: Number(req.query.threshold) });
  sendSuccess(res, data);
});

// ── Category GMV ───────────────────────────────────────────────────────────
router.get('/stats/categories', async (req, res) => {
  const data = await adminService.getCategoryGmv();
  sendSuccess(res, data);
});

// ── Orders (platform-wide) ────────────────────────────────────────────────
const ordersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'CANCELLED', 'DISPUTED']).optional(),
  brandId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

router.get('/orders', validateQuery(ordersQuerySchema), async (req, res) => {
  const result = await adminService.listOrders(req.query);
  sendSuccess(res, result);
});

// ── Marketing ──────────────────────────────────────────────────────────────
// Manual trigger for the weekly digest (useful for testing before Monday)
router.post('/digest/send', async (req, res) => {
  const result = await sendWeeklyDigests();
  sendSuccess(res, result, `Digest sent to ${result.sent} buyers`);
});

export default router;
