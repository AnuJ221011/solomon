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

export const getBrandById = async (brandProfileId) => {
  const brand = await prisma.brandProfile.findUnique({
    where: { id: brandProfileId },
    include: {
      user: { select: { email: true, isActive: true, createdAt: true } },
      _count: { select: { products: true, orders: true } },
    },
  });
  if (!brand) throw createError('Brand not found', 404);
  return brand;
};

export const getApprovedBrands = async () => {
  return prisma.brandProfile.findMany({
    where: { status: 'APPROVED' },
    include: {
      user: { select: { email: true } },
      _count: { select: { products: true } },
    },
    orderBy: { approvedAt: 'desc' },
  });
};

export const listUsers = async ({ page = 1, limit = 20, search, role, status }) => {
  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (role) where.role = role;
  if (status === 'ACTIVE') where.isActive = true;
  else if (status === 'SUSPENDED') where.isActive = false;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
        brandProfile: { select: { id: true, slug: true, totalGmvInr: true, confirmedOrderCount: true } },
        _count: { select: { orders: true } },
        orders: { select: { totalInr: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.isActive ? 'ACTIVE' : 'SUSPENDED',
      createdAt: u.createdAt,
      ordersCount: u.role === 'BUYER' ? u._count.orders : (u.brandProfile?.confirmedOrderCount ?? 0),
      gmvInr: u.role === 'BUYER'
        ? u.orders.reduce((s, o) => s + Number(o.totalInr ?? 0), 0)
        : Number(u.brandProfile?.totalGmvInr ?? 0),
      brandSlug: u.brandProfile?.slug ?? null,
      brandProfileId: u.brandProfile?.id ?? null,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getUsersCsv = async () => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
      brandProfile: { select: { totalGmvInr: true, confirmedOrderCount: true } },
      _count: { select: { orders: true } },
      orders: { select: { totalInr: true } },
    },
  });

  const header = 'ID,Name,Email,Role,Status,Orders,GMV_INR,Joined\n';
  const rows = users.map((u) => {
    const gmv = u.role === 'BUYER'
      ? u.orders.reduce((s, o) => s + Number(o.totalInr ?? 0), 0)
      : Number(u.brandProfile?.totalGmvInr ?? 0);
    const orders = u.role === 'BUYER' ? u._count.orders : (u.brandProfile?.confirmedOrderCount ?? 0);
    return [u.id, `"${u.name}"`, u.email, u.role, u.isActive ? 'ACTIVE' : 'SUSPENDED', orders, gmv, u.createdAt.toISOString()].join(',');
  }).join('\n');

  return header + rows;
};

export const getPlatformStats = async () => {
  const [
    totalBrands, pendingApprovals, totalBuyers, totalOrders,
    pendingPayoutsAgg, pendingPayoutsCount, gmv, openDisputes,
  ] = await Promise.all([
    prisma.brandProfile.count({ where: { status: 'APPROVED' } }),
    prisma.brandProfile.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { role: 'BUYER' } }),
    prisma.order.count(),
    prisma.payout.aggregate({ where: { isPaid: false }, _sum: { netInr: true } }),
    prisma.payout.count({ where: { isPaid: false } }),
    prisma.order.aggregate({ _sum: { totalInr: true } }),
    prisma.order.count({ where: { status: 'DISPUTED', disputeResolution: null } }),
  ]);

  return {
    totalBrands,
    pendingApprovals,
    totalBuyers,
    totalOrders,
    totalGMV: Number(gmv._sum.totalInr ?? 0),
    openDisputes,
    pendingPayouts: pendingPayoutsCount,
    pendingPayoutsValue: Number(pendingPayoutsAgg._sum.netInr ?? 0),
  };
};

// ── Disputes ──────────────────────────────────────────────────────────────────

export const listDisputes = async ({ page = 1, limit = 20, status }) => {
  const where = {};
  if (status === 'OPEN' || !status) {
    where.status = 'DISPUTED';
    where.disputeResolution = null;
  } else if (status === 'RESOLVED') {
    where.disputeResolution = 'RESOLVED';
  } else if (status === 'CLOSED') {
    where.disputeResolution = 'CLOSED';
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { name: true } },
        brand: { select: { brandName: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    disputes: orders.map((o) => ({
      id: o.id,
      orderId: o.id,
      orderNumber: o.id.slice(-8).toUpperCase(),
      buyerName: o.buyer.name,
      brandName: o.brand.brandName,
      amount: Number(o.totalInr),
      reason: o.disputeReason ?? o.notes ?? 'No reason provided',
      status: o.disputeResolution === 'RESOLVED' ? 'RESOLVED'
        : o.disputeResolution === 'CLOSED' ? 'CLOSED'
        : 'OPEN',
      createdAt: o.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const resolveDispute = async (orderId) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw createError('Order not found', 404);
  if (order.status !== 'DISPUTED') throw createError('Order is not in a disputed state', 400);
  return prisma.order.update({
    where: { id: orderId },
    data: { disputeResolution: 'RESOLVED', status: 'DELIVERED', deliveredAt: new Date() },
  });
};

export const closeDispute = async (orderId) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw createError('Order not found', 404);
  if (order.status !== 'DISPUTED') throw createError('Order is not in a disputed state', 400);
  return prisma.order.update({
    where: { id: orderId },
    data: { disputeResolution: 'CLOSED', status: 'CANCELLED' },
  });
};

// ── Products (platform-wide) ──────────────────────────────────────────────────

export const listProducts = async ({ page = 1, limit = 20, search, brandId, availability }) => {
  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { brandProfile: { brandName: { contains: search, mode: 'insensitive' } } },
    ];
  }
  if (brandId) where.brandProfileId = brandId;
  if (availability) where.availability = availability;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        brandProfile: { select: { brandName: true, slug: true } },
        photos: { orderBy: { position: 'asc' }, take: 1 },
        variants: { select: { id: true, stock: true, status: true, sku: true, priceInr: true } },
        _count: { select: { orderItems: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((p) => {
      const totalStock = p.variants.reduce((s, v) => s + v.stock, 0);
      const activeVariants = p.variants.filter((v) => v.status === 'ACTIVE').length;
      const outOfStock = p.variants.length > 0 && p.variants.every((v) => v.stock === 0);
      return {
        id: p.id,
        name: p.name,
        brandName: p.brandProfile.brandName,
        brandSlug: p.brandProfile.slug,
        availability: p.availability,
        photoUrl: p.photos[0]?.url ?? null,
        wholesalePriceInr: Number(p.wholesalePriceInr),
        moq: p.moq,
        totalStock,
        variantCount: p.variants.length,
        activeVariants,
        outOfStock,
        orderCount: p._count.orderItems,
        viewCount: p.viewCount,
        categories: p.categories,
        createdAt: p.createdAt,
      };
    }),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// ── Returns (platform-wide) ───────────────────────────────────────────────────

export const listReturns = async ({ page = 1, limit = 20, status }) => {
  const where = {};
  if (status) where.status = status;

  const [returns, total] = await Promise.all([
    prisma.return.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          include: {
            buyer: { select: { name: true } },
            brand: { select: { brandName: true } },
          },
        },
      },
    }),
    prisma.return.count({ where }),
  ]);

  return {
    returns: returns.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      orderNumber: r.orderId.slice(-8).toUpperCase(),
      buyerName: r.order.buyer.name,
      brandName: r.order.brand.brandName,
      reason: r.reason,
      status: r.status,
      photoUrls: r.photoUrls,
      adminNotes: r.adminNotes,
      returnLabelUrl: r.returnLabelUrl,
      resolvedAt: r.resolvedAt,
      createdAt: r.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const approveReturn = async (returnId) => {
  const ret = await prisma.return.findUnique({ where: { id: returnId } });
  if (!ret) throw createError('Return not found', 404);
  return prisma.return.update({ where: { id: returnId }, data: { status: 'APPROVED' } });
};

export const rejectReturn = async (returnId, adminNotes) => {
  const ret = await prisma.return.findUnique({ where: { id: returnId } });
  if (!ret) throw createError('Return not found', 404);
  return prisma.return.update({
    where: { id: returnId },
    data: { status: 'REJECTED', adminNotes: adminNotes ?? null, resolvedAt: new Date() },
  });
};

export const refundReturn = async (returnId) => {
  const ret = await prisma.return.findUnique({ where: { id: returnId } });
  if (!ret) throw createError('Return not found', 404);
  return prisma.return.update({
    where: { id: returnId },
    data: { status: 'REFUNDED', resolvedAt: new Date() },
  });
};

export const issueReturnLabel = async (returnId, returnLabelUrl) => {
  const ret = await prisma.return.findUnique({ where: { id: returnId } });
  if (!ret) throw createError('Return not found', 404);
  if (ret.status !== 'APPROVED') throw createError('Return must be APPROVED before issuing a label', 400);
  return prisma.return.update({
    where: { id: returnId },
    data: { status: 'LABEL_ISSUED', returnLabelUrl: returnLabelUrl ?? null },
  });
};

// ── Orders (platform-wide) ────────────────────────────────────────────────────

export const listOrders = async ({ page = 1, limit = 20, search, status, brandId, dateFrom, dateTo } = {}) => {
  const where = {};
  if (status) where.status = status;
  if (brandId) where.brandProfileId = brandId;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }
  if (search) {
    where.OR = [
      { buyer: { name: { contains: search, mode: 'insensitive' } } },
      { brand: { brandName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { name: true, email: true } },
        brand: { select: { brandName: true, slug: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map((o) => ({
      id: o.id,
      orderNumber: o.id.slice(-8).toUpperCase(),
      buyerName: o.buyer.name,
      buyerEmail: o.buyer.email,
      brandName: o.brand.brandName,
      brandSlug: o.brand.slug,
      status: o.status,
      totalInr: Number(o.totalInr),
      itemCount: o._count.items,
      notes: o.notes,
      disputeReason: o.disputeReason,
      createdAt: o.createdAt,
      deliveredAt: o.deliveredAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

// ── Revenue over time ─────────────────────────────────────────────────────────

export const getRevenueOverTime = async ({ days = 30 } = {}) => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since }, status: { notIn: ['CANCELLED'] } },
    select: { totalInr: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Build day-keyed buckets
  const buckets = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    buckets[key] = 0;
  }

  for (const o of orders) {
    const key = o.createdAt.toISOString().slice(0, 10);
    if (buckets[key] !== undefined) {
      buckets[key] += Number(o.totalInr);
    }
  }

  return Object.entries(buckets).map(([date, revenue]) => ({ date, revenue }));
};

// ── Low stock ─────────────────────────────────────────────────────────────────

export const getLowStockVariants = async ({ threshold = 10 } = {}) => {
  const variants = await prisma.productVariant.findMany({
    where: { stock: { lte: threshold }, status: 'ACTIVE' },
    orderBy: { stock: 'asc' },
    take: 100,
    include: {
      product: {
        include: {
          brandProfile: { select: { brandName: true, slug: true } },
          photos: { orderBy: { position: 'asc' }, take: 1 },
        },
      },
      attributes: true,
    },
  });

  return variants.map((v) => ({
    variantId: v.id,
    sku: v.sku,
    stock: v.stock,
    productId: v.productId,
    productName: v.product.name,
    brandName: v.product.brandProfile.brandName,
    brandSlug: v.product.brandProfile.slug,
    photoUrl: v.product.photos[0]?.url ?? null,
    attributes: v.attributes.map((a) => `${a.name}: ${a.value}`).join(', '),
  }));
};

// ── Category GMV ──────────────────────────────────────────────────────────────

export const getCategoryGmv = async () => {
  const items = await prisma.orderItem.findMany({
    where: { order: { status: { notIn: ['CANCELLED'] } } },
    select: {
      totalInr: true,
      quantity: true,
      product: { select: { categories: true } },
    },
  });

  const map = {};
  const countMap = {};
  for (const item of items) {
    for (const cat of item.product.categories) {
      map[cat] = (map[cat] ?? 0) + Number(item.totalInr);
      countMap[cat] = (countMap[cat] ?? 0) + item.quantity;
    }
  }

  return Object.entries(map)
    .map(([category, gmvInr]) => ({ category, gmvInr, unitsSold: countMap[category] ?? 0 }))
    .sort((a, b) => b.gmvInr - a.gmvInr);
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
