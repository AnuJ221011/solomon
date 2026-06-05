import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';
import { sendBrandApprovalEmail } from '../../shared/utils/email.js';

export const approveBrand = async (brandProfileId) => {
  const brand = await prisma.brandProfile.findUnique({
    where: { id: brandProfileId },
    include: { user: { select: { email: true } } },
  });
  if (!brand) throw createError('Brand not found', 404);
  if (brand.status === 'APPROVED') throw createError('Brand is already approved', 400);

  const updated = await prisma.brandProfile.update({
    where: { id: brandProfileId },
    data: { status: 'APPROVED', approvedAt: new Date() },
  });

  await sendBrandApprovalEmail(brand.user.email, brand.brandName).catch(() => {});
  return updated;
};

export const rejectBrand = async (brandProfileId) => {
  const brand = await prisma.brandProfile.findUnique({ where: { id: brandProfileId } });
  if (!brand) throw createError('Brand not found', 404);

  return prisma.brandProfile.update({
    where: { id: brandProfileId },
    data: { status: 'REJECTED' },
  });
};

export const suspendUser = async (userId) => {
  return prisma.user.update({ where: { id: userId }, data: { isActive: false } });
};

export const reactivateUser = async (userId) => {
  return prisma.user.update({ where: { id: userId }, data: { isActive: true } });
};

export const overrideAchievementLevel = async (brandProfileId, level) => {
  const validLevels = ['L1_SPROUT', 'L2_RISING', 'L3_TRUSTED', 'L4_ELITE', 'L5_LEGEND'];
  if (!validLevels.includes(level)) throw createError('Invalid achievement level', 400);

  return prisma.brandProfile.update({
    where: { id: brandProfileId },
    data: { achievementLevel: level, isAdminOverride: true },
  });
};

export const getPendingBrands = async () => {
  return prisma.brandProfile.findMany({
    where: { status: 'PENDING' },
    include: { user: { select: { email: true, createdAt: true } } },
    orderBy: { createdAt: 'asc' },
  });
};

export const getPlatformStats = async () => {
  const [totalBrands, totalBuyers, totalOrders, pendingPayouts, gmv] = await Promise.all([
    prisma.brandProfile.count({ where: { status: 'APPROVED' } }),
    prisma.user.count({ where: { role: 'BUYER' } }),
    prisma.order.count(),
    prisma.payout.aggregate({ where: { isPaid: false }, _sum: { netInr: true } }),
    prisma.order.aggregate({ _sum: { totalInr: true } }),
  ]);

  return {
    totalBrands,
    totalBuyers,
    totalOrders,
    pendingPayoutInr: pendingPayouts._sum.netInr ?? 0,
    totalGmvInr: gmv._sum.totalInr ?? 0,
  };
};

// ── Payout management ─────────────────────────────────────────────────────

export const listPayouts = async ({ page = 1, limit = 50, isPaid, brandId, dateFrom, dateTo }) => {
  const where = {};
  if (isPaid !== undefined) where.isPaid = isPaid;
  if (brandId) where.brandProfileId = brandId;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const [payouts, total] = await Promise.all([
    prisma.payout.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ isPaid: 'asc' }, { scheduledAt: 'asc' }],
      include: {
        brandProfile: { select: { brandName: true, slug: true } },
        order: { select: { id: true, buyerCurrency: true, totalBuyerCurrency: true } },
      },
    }),
    prisma.payout.count({ where }),
  ]);

  return { payouts, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const markPayoutPaid = async (payoutId, { paypalBatchId }) => {
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout) throw createError('Payout not found', 404);
  if (payout.isPaid) throw createError('Payout already marked as paid', 400);

  return prisma.payout.update({
    where: { id: payoutId },
    data: { isPaid: true, paidAt: new Date(), paypalBatchId },
  });
};

export const markBulkPayoutsPaid = async (payoutIds, paypalBatchId) => {
  return prisma.payout.updateMany({
    where: { id: { in: payoutIds }, isPaid: false },
    data: { isPaid: true, paidAt: new Date(), paypalBatchId },
  });
};

/**
 * Returns all pending payouts as a CSV string for admin download.
 */
export const getPayoutsCsv = async (isPaid = false) => {
  const payouts = await prisma.payout.findMany({
    where: { isPaid },
    include: {
      brandProfile: {
        select: {
          brandName: true,
          user: { select: { email: true } },
        },
      },
      order: {
        select: {
          id: true,
          createdAt: true,
          buyerCurrency: true,
          totalBuyerCurrency: true,
          payoutSpeed: false,
        },
      },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  const header = 'PayoutID,OrderID,BrandName,BrandEmail,GrossINR,CommissionINR,ProcessingFeeINR,NetINR,PayoutSpeed,ScheduledAt,PaidAt,PayPalBatchID\n';
  const rows = payouts.map((p) =>
    [
      p.id,
      p.orderId,
      `"${p.brandProfile.brandName}"`,
      p.brandProfile.user.email,
      p.grossInr,
      p.commissionInr,
      p.processingFeeInr,
      p.netInr,
      p.payoutSpeed,
      p.scheduledAt?.toISOString() ?? '',
      p.paidAt?.toISOString() ?? '',
      p.paypalBatchId ?? '',
    ].join(',')
  ).join('\n');

  return header + rows;
};
