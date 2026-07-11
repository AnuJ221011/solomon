import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';

export const getMyBankAccount = async (userId) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);
  return prisma.bankAccount.findUnique({ where: { brandProfileId: brand.id } });
};

export const upsertMyBankAccount = async (userId, data) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);
  const { accountHolderName, bankName, accountNumber, ifscCode, accountType, upiId } = data;
  const payload = { accountHolderName, bankName, accountNumber, ifscCode, accountType, upiId: upiId || null };
  return prisma.bankAccount.upsert({
    where: { brandProfileId: brand.id },
    create: { brandProfileId: brand.id, ...payload },
    update: payload,
  });
};

// Real payout data (the actual per-order Payout rows created at order time
// with the brand's true achievement-tier commission), not a client-side
// estimate off raw order totals.
export const getMyPayouts = async (userId) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);

  const payouts = await prisma.payout.findMany({
    where: { brandProfileId: brand.id },
    include: {
      order: {
        select: { id: true, createdAt: true, subtotalInr: true, commissionRate: true, buyer: { select: { name: true } } },
      },
    },
    orderBy: [{ isPaid: 'asc' }, { scheduledAt: 'asc' }],
  });

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const rows = payouts.map((p) => ({
    id: p.id,
    orderId: p.orderId,
    orderNumber: p.orderId.slice(-8).toUpperCase(),
    buyerName: p.order.buyer.name,
    date: p.order.createdAt.toISOString().slice(0, 10),
    grossInr: Number(p.grossInr),
    commissionRate: Number(p.order.commissionRate),
    commissionInr: Number(p.commissionInr),
    processingFeeInr: Number(p.processingFeeInr),
    netInr: Number(p.netInr),
    payoutSpeed: p.payoutSpeed,
    isPaid: p.isPaid,
    scheduledAt: p.scheduledAt,
    paidAt: p.paidAt,
  }));

  const pending = rows.filter((r) => !r.isPaid);
  const paidThisMonth = rows.filter((r) => r.isPaid && r.paidAt && r.paidAt.toISOString().startsWith(thisMonthKey));
  const paid = rows.filter((r) => r.isPaid);

  return {
    rows,
    summary: {
      pendingTotalInr: pending.reduce((s, r) => s + r.netInr, 0),
      pendingCount: pending.length,
      paidThisMonthInr: paidThisMonth.reduce((s, r) => s + r.netInr, 0),
      totalPaidInr: paid.reduce((s, r) => s + r.netInr, 0),
    },
  };
};

export const getBrandBySlug = async (slug) => {
  const brand = await prisma.brandProfile.findUnique({
    where: { slug },
    include: {
      user: { select: { email: true, avatarUrl: true } },
      products: {
        where: { availability: 'ACTIVE' },
        include: { photos: { orderBy: { position: 'asc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
      },
      collections: {
        where: { isActive: true },
        include: {
          products: {
            include: {
              product: {
                include: { photos: { orderBy: { position: 'asc' }, take: 1 } },
              },
            },
            orderBy: { position: 'asc' },
          },
        },
      },
      promotions: {
        where: {
          isActive: true,
          startsAt: { lte: new Date() },
          OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }],
        },
      },
    },
  });
  if (!brand) throw createError('Brand not found', 404);
  return brand;
};

export const getBrandById = async (id) => {
  const brand = await prisma.brandProfile.findUnique({
    where: { id },
    include: { user: { select: { email: true } } },
  });
  if (!brand) throw createError('Brand not found', 404);
  return brand;
};

export const getMyBrand = async (userId) => {
  const brand = await prisma.brandProfile.findUnique({
    where: { userId },
    include: {
      shippingRates: true,
      collections: { where: { isActive: true } },
      promotions: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!brand) throw createError('Brand profile not found', 404);
  return brand;
};

export const updateBrandProfile = async (userId, updates) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);
  return prisma.brandProfile.update({ where: { userId }, data: updates });
};

export const listBrands = async ({ page, limit, status, level, category, search, slugs }) => {
  const where = { status: status ?? 'APPROVED' };
  if (level) where.achievementLevel = level;
  if (category) where.category = { has: category };
  if (search) where.brandName = { contains: search, mode: 'insensitive' };
  if (slugs) where.slug = { in: slugs.split(',').map((s) => s.trim()).filter(Boolean) };

  const [brands, total] = await Promise.all([
    prisma.brandProfile.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ achievementLevel: 'desc' }, { avgRating: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true, brandName: true, slug: true, category: true,
        achievementLevel: true, avgRating: true, logoUrl: true, bannerUrl: true,
        description: true, countryOfOrigin: true, city: true, state: true,
        yearFounded: true, minimumOrderValue: true,
        _count: { select: { products: { where: { availability: 'ACTIVE' } } } },
      },
    }),
    prisma.brandProfile.count({ where }),
  ]);

  return {
    brands: brands.map(({ _count, ...rest }) => ({ ...rest, productCount: _count.products })),
    total, page, limit, totalPages: Math.ceil(total / limit),
  };
};

export const getBrandDashboardStats = async (userId) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);

  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);

  const [ordersThisMonth, ordersLastMonth, pendingPayoutSum, shareLinks] = await Promise.all([
    prisma.order.aggregate({
      where: { brandProfileId: brand.id, createdAt: { gte: thirtyDaysAgo } },
      _count: true,
      _sum: { totalInr: true },
    }),
    prisma.order.aggregate({
      where: {
        brandProfileId: brand.id,
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
      _count: true,
      _sum: { totalInr: true },
    }),
    prisma.payout.aggregate({
      where: { brandProfileId: brand.id, isPaid: false },
      _sum: { netInr: true },
    }),
    prisma.shareLink.findMany({
      where: { brandProfileId: brand.id, isActive: true },
      select: { id: true, token: true, slug: true, target: true, viewCount: true, signupCount: true, orderCount: true, revenueInr: true, commissionSavedInr: true },
    }),
  ]);

  return {
    gmvThisMonthInr: ordersThisMonth._sum.totalInr ?? 0,
    gmvLastMonthInr: ordersLastMonth._sum.totalInr ?? 0,
    ordersThisMonth: ordersThisMonth._count,
    ordersLastMonth: ordersLastMonth._count,
    pendingPayoutInr: pendingPayoutSum._sum.netInr ?? 0,
    totalGmvInr: brand.totalGmvInr,
    avgRating: brand.avgRating,
    confirmedOrderCount: brand.confirmedOrderCount,
    achievementLevel: brand.achievementLevel,
    shareLinks,
  };
};
