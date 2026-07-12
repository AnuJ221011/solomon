import { Router } from 'express';
import { z } from 'zod';
import * as ctrl from './brand.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { validate, validateQuery } from '../../shared/middleware/validate.js';
import { updateBrandProfileSchema, brandQuerySchema, bankAccountSchema } from './brand.validator.js';
import { DOC_FIELDS, getSignedDocUrl } from '../../shared/utils/cloudinaryDocUrl.js';
import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';
import { sendSuccess } from '../../shared/utils/response.js';

const router = Router();

// Public list
router.get('/', validateQuery(brandQuerySchema), ctrl.listBrands);

// Brand-only — must be declared before /:slug so Express doesn't swallow them
router.get('/me/profile', authenticate, authorize('BRAND'), ctrl.getMyBrand);
router.patch('/me/profile', authenticate, authorize('BRAND'), validate(updateBrandProfileSchema), ctrl.updateMyBrand);
router.get('/me/dashboard', authenticate, authorize('BRAND'), ctrl.getDashboardStats);
router.get('/me/bank-account', authenticate, authorize('BRAND'), ctrl.getMyBankAccount);
router.post('/me/bank-account', authenticate, authorize('BRAND'), validate(bankAccountSchema), ctrl.upsertMyBankAccount);
router.get('/me/payouts', authenticate, authorize('BRAND'), ctrl.getMyPayouts);

// Document viewer for the brand's own submitted documents — same signed-URL
// mechanism as the admin doc viewer, scoped to the requesting brand's own
// profile so a brand can never fetch another brand's documents by field name.
router.get('/me/documents/doc-url', authenticate, authorize('BRAND'), validateQuery(z.object({ field: z.enum(DOC_FIELDS) })), async (req, res) => {
  const brand = await prisma.brandProfile.findUnique({
    where: { userId: req.user.id },
    select: { [req.query.field]: true },
  });
  const storedUrl = brand?.[req.query.field];
  if (!storedUrl) throw createError('Document not found', 404);

  const { url, ext } = getSignedDocUrl(storedUrl);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  sendSuccess(res, { url, ext });
});

// Payout CSV export for brand
router.get('/me/payouts/export', authenticate, authorize('BRAND'), async (req, res) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId: req.user.id } });
  if (!brand) throw createError('Brand profile not found', 404);

  const isPaid = req.query.isPaid === 'true';
  const payouts = await prisma.payout.findMany({
    where: { brandProfileId: brand.id, isPaid },
    include: { order: { select: { id: true, createdAt: true, buyerCurrency: true, totalBuyerCurrency: true } } },
    orderBy: { scheduledAt: 'asc' },
  });

  const header = 'PayoutID,OrderID,GrossINR,CommissionINR,ProcessingFeeINR,NetINR,PayoutSpeed,ScheduledAt,PaidAt\n';
  const rows = payouts.map((p) =>
    [p.id, p.orderId, p.grossInr, p.commissionInr, p.processingFeeInr, p.netInr,
     p.payoutSpeed, p.scheduledAt?.toISOString() ?? '', p.paidAt?.toISOString() ?? ''].join(',')
  ).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="payouts_${Date.now()}.csv"`);
  res.send(header + rows);
});

// Public — must come last so /me/* routes above take priority
router.get('/:slug', ctrl.getBrandBySlug);

export default router;
