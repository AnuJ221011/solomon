import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';
import { getCachedRates } from '../../shared/utils/currency.js';
import { calculateShipping } from '../shipping/shipping.service.js';
import { getCommissionRate } from '../../shared/constants/achievements.js';
import { SHARE_LINK_ATTRIBUTION_DAYS, EXPRESS_PAYOUT_FEE } from '../../shared/constants/roles.js';
import { logger } from '../../shared/utils/logger.js';
import {
  sendOrderConfirmationBuyer,
  sendOrderConfirmationBrand,
  sendDispatchNotificationBuyer,
} from '../../shared/utils/email.js';

/**
 * Determines the commission rate for an order.
 * 0% if the buyer has an active share link attribution from this brand.
 * Otherwise uses the brand's achievement tier rate.
 */
const resolveCommissionRate = async (buyerUserId, brandProfileId) => {
  const cutoff = new Date(Date.now() - SHARE_LINK_ATTRIBUTION_DAYS * 24 * 60 * 60 * 1000);

  const attribution = await prisma.userShareLinkAttribution.findFirst({
    where: {
      userId: buyerUserId,
      recordedAt: { gte: cutoff },
      shareLink: { brandProfileId },
    },
    include: { shareLink: { select: { id: true } } },
  });

  if (attribution) {
    return { rate: 0, shareLinkId: attribution.shareLink.id };
  }

  const brand = await prisma.brandProfile.findUnique({
    where: { id: brandProfileId },
    select: { achievementLevel: true },
  });

  return { rate: getCommissionRate(brand.achievementLevel), shareLinkId: null };
};

/**
 * Converts the buyer's cart into one Order per brand.
 * Called after PayPal payment capture.
 */
export const createOrdersFromCart = async (buyerUserId, { shippingAddress, paypalOrderId, walletCreditsToApplyInr }) => {
  const cart = await prisma.cart.findUnique({
    where: { userId: buyerUserId },
    include: {
      items: {
        include: {
          product: {
            include: {
              brandProfile: { select: { id: true, achievementLevel: true, payoutSpeed: true } },
            },
          },
          variant: { include: { attributes: true } },
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) throw createError('Cart is empty', 400);

  const buyer = await prisma.user.findUnique({
    where: { id: buyerUserId },
    include: { buyerProfile: true },
  });

  const countryCode = shippingAddress.countryCode;
  const rates = await getCachedRates();
  const buyerCurrency = buyer.buyerProfile?.preferredCurrency ?? 'USD';
  const fxRate = rates?.[buyerCurrency] ?? 1;

  // Group cart items by brand
  const byBrand = cart.items.reduce((acc, item) => {
    const brandId = item.product.brandProfileId;
    if (!acc[brandId]) acc[brandId] = { brand: item.product.brandProfile, items: [] };
    acc[brandId].items.push(item);
    return acc;
  }, {});

  const createdOrders = [];

  await prisma.$transaction(async (tx) => {
    for (const [brandProfileId, { brand, items }] of Object.entries(byBrand)) {
      // Use variant price when available, fall back to product price
      const subtotalInr = items.reduce((sum, item) => {
        const unitPrice = item.variant ? Number(item.variant.priceInr) : Number(item.product.wholesalePriceInr);
        return sum + unitPrice * item.quantity;
      }, 0);
      const totalWeightGrams = items.reduce((sum, item) => sum + item.product.weightGrams * item.quantity, 0);

      const shippingResult = await calculateShipping(brandProfileId, countryCode, totalWeightGrams, subtotalInr);
      const shippingCostInr = shippingResult.requiresQuote ? 0 : (shippingResult.shippingCostInr ?? 0);

      const { rate: commissionRate, shareLinkId } = await resolveCommissionRate(buyerUserId, brandProfileId);
      const commissionInr = parseFloat((subtotalInr * commissionRate).toFixed(2));
      const totalInr = subtotalInr + shippingCostInr;
      const totalBuyerCurrency = parseFloat((totalInr * fxRate).toFixed(2));

      // Is this the buyer's first order from this brand?
      const previousOrderCount = await tx.order.count({
        where: { buyerUserId, brandProfileId, status: { not: 'CANCELLED' } },
      });
      const isOpeningOrder = previousOrderCount === 0;

      const order = await tx.order.create({
        data: {
          buyerUserId,
          brandProfileId,
          subtotalInr,
          shippingCostInr,
          commissionRate,
          commissionInr,
          totalInr,
          buyerCurrency,
          totalBuyerCurrency,
          fxRateUsed: fxRate,
          shippingZone: shippingResult.zone,
          isOpeningOrder,
          isManualOrder: false,
          paypalOrderId,
          shareLinkId,
          items: {
            create: items.map((item) => {
              // Use variant price when a variant is selected, fall back to product price
              const unitPrice = item.variant
                ? Number(item.variant.priceInr)
                : Number(item.product.wholesalePriceInr);

              // Build a human-readable label snapshot (e.g. "Color: Red / Size: L")
              const variantLabel = item.variant?.attributes?.length
                ? item.variant.attributes.map((a) => `${a.name}: ${a.value}`).join(' / ')
                : null;

              return {
                productId: item.productId,
                variantId: item.variantId ?? null,
                variantLabel,
                quantity: item.quantity,
                unitPriceInr: unitPrice,
                totalInr: unitPrice * item.quantity,
              };
            }),
          },
        },
        include: { items: true },
      });

      // Create payout record
      const processingFeeInr = brand.payoutSpeed === 'EXPRESS'
        ? parseFloat(((subtotalInr + shippingCostInr) * EXPRESS_PAYOUT_FEE).toFixed(2))
        : 0;
      const netInr = parseFloat((totalInr - commissionInr - processingFeeInr).toFixed(2));

      await tx.payout.create({
        data: {
          brandProfileId,
          orderId: order.id,
          grossInr: totalInr,
          commissionInr,
          processingFeeInr,
          netInr,
          payoutSpeed: brand.payoutSpeed,
          scheduledAt: brand.payoutSpeed === 'NET_30'
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            : null,
        },
      });

      // Update brand stats
      await tx.brandProfile.update({
        where: { id: brandProfileId },
        data: {
          confirmedOrderCount: { increment: 1 },
          totalGmvInr: { increment: subtotalInr },
        },
      });

      // Update product order counts + decrement variant stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { orderCount: { increment: item.quantity } },
        });

        if (item.variantId) {
          const newStock = Math.max(0, (item.variant?.stock ?? 0) - item.quantity);
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: newStock,
              status: newStock === 0 ? 'OUT_OF_STOCK' : 'ACTIVE',
            },
          });
        }
      }

      // Update share link stats if attributed
      if (shareLinkId) {
        await tx.shareLink.update({
          where: { id: shareLinkId },
          data: {
            orderCount: { increment: 1 },
            revenueInr: { increment: subtotalInr },
            commissionSavedInr: {
              increment: parseFloat((subtotalInr * getCommissionRate(brand.achievementLevel)).toFixed(2)),
            },
          },
        });
      }

      createdOrders.push(order);
    }

    // Apply wallet credits if requested
    if (walletCreditsToApplyInr > 0) {
      const wallet = await tx.wallet.findUnique({ where: { userId: buyerUserId } });
      if (wallet && Number(wallet.balanceInr) >= walletCreditsToApplyInr) {
        await tx.wallet.update({
          where: { userId: buyerUserId },
          data: { balanceInr: { decrement: walletCreditsToApplyInr } },
        });
      }
    }

    // Clear cart
    await tx.cartItem.deleteMany({ where: { cart: { userId: buyerUserId } } });
  });

  // Send confirmation emails (fire-and-forget)
  setImmediate(async () => {
    try {
      const buyer = await prisma.user.findUnique({
        where: { id: buyerUserId },
        include: { buyerProfile: true },
      });

      for (const order of createdOrders) {
        const brand = await prisma.brandProfile.findUnique({
          where: { id: order.brandProfileId },
          include: { user: { select: { email: true } } },
        });
        const itemCount = order.items?.length ?? 0;

        // To buyer (once per brand order)
        await sendOrderConfirmationBuyer(buyer.email, {
          buyerName: buyer.name,
          orderIds: [order.id],
          brandName: brand.brandName,
          totalBuyerCurrency: order.totalBuyerCurrency,
          currency: order.buyerCurrency,
        }).catch(() => {});

        // To brand
        await sendOrderConfirmationBrand(brand.user.email, {
          brandName: brand.brandName,
          orderId: order.id,
          buyerBusinessName: buyer.buyerProfile?.businessName ?? buyer.name,
          itemCount,
          totalInr: order.totalInr,
        }).catch(() => {});
      }
    } catch (err) {
      logger.error('Order confirmation email failed', { error: err.message });
    }
  });

  return createdOrders;
};

/**
 * Creates a manual order on behalf of a wholesale customer (0% commission).
 */
export const createManualOrder = async (brandUserId, data) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId: brandUserId } });
  if (!brand) throw createError('Brand profile not found', 404);

  const rates = await getCachedRates();
  const fxRate = rates?.['USD'] ?? 1;

  let subtotalInr = 0;
  const orderItems = [];

  for (const item of data.items) {
    const product = await prisma.product.findFirst({
      where: { id: item.productId, brandProfileId: brand.id },
    });
    if (!product) throw createError(`Product ${item.productId} not found`, 404);

    const lineTotal = Number(product.wholesalePriceInr) * item.quantity;
    subtotalInr += lineTotal;
    orderItems.push({
      productId: item.productId,
      variantOptions: item.variantOptions,
      quantity: item.quantity,
      unitPriceInr: product.wholesalePriceInr,
      totalInr: lineTotal,
    });
  }

  const shippingResult = await calculateShipping(brand.id, data.countryCode, 0, subtotalInr);
  const shippingCostInr = shippingResult.requiresQuote ? 0 : (shippingResult.shippingCostInr ?? 0);
  const totalInr = subtotalInr + shippingCostInr;

  return prisma.order.create({
    data: {
      buyerUserId: brandUserId, // placeholder — manual orders may not have a platform buyer
      brandProfileId: brand.id,
      subtotalInr,
      shippingCostInr,
      commissionRate: 0,
      commissionInr: 0,
      totalInr,
      buyerCurrency: 'USD',
      totalBuyerCurrency: parseFloat((totalInr * fxRate).toFixed(2)),
      fxRateUsed: fxRate,
      shippingZone: shippingResult.zone,
      isManualOrder: true,
      isOpeningOrder: false,
      notes: data.notes,
      items: { create: orderItems },
    },
    include: { items: true },
  });
};

export const updateOrderStatus = async (brandUserId, orderId, { status, trackingNumber, trackingCarrier }) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId: brandUserId } });
  if (!brand) throw createError('Brand profile not found', 404);

  const order = await prisma.order.findFirst({
    where: { id: orderId, brandProfileId: brand.id },
  });
  if (!order) throw createError('Order not found', 404);

  const updateData = { status };
  if (trackingNumber) updateData.trackingNumber = trackingNumber;
  if (trackingCarrier) updateData.trackingCarrier = trackingCarrier;
  if (status === 'DISPATCHED') updateData.dispatchedAt = new Date();
  if (status === 'DELIVERED') updateData.deliveredAt = new Date();

  const updated = await prisma.order.update({ where: { id: orderId }, data: updateData, include: { items: true } });

  // ── Post-status-change side-effects (fire-and-forget — don't block response) ──

  if (status === 'CONFIRMED') {
    // Recalculate brand achievement level
    setImmediate(() => _triggerAchievementRecalculation(brand.id));
  }

  if (status === 'DISPATCHED') {
    setImmediate(() => _onOrderDispatched(order, brand.id));
  }

  return updated;
};

// ── Internal trigger helpers ────────────────────────────────────────────────

const _triggerAchievementRecalculation = async (brandProfileId) => {
  try {
    const { recalculateAchievement } = await import('../achievements/index.js');
    const previousLevel = (await prisma.brandProfile.findUnique({ where: { id: brandProfileId }, select: { achievementLevel: true } }))?.achievementLevel;
    await recalculateAchievement(brandProfileId);
    // If brand just hit L2, trigger referral bonus check
    const newLevel = (await prisma.brandProfile.findUnique({ where: { id: brandProfileId }, select: { achievementLevel: true } }))?.achievementLevel;
    if (previousLevel !== newLevel && newLevel === 'L2_RISING') {
      const { processBonusIfEligible } = await import('../referrals/index.js');
      await processBonusIfEligible(brandProfileId);
    }
  } catch (err) {
    logger.error('Achievement recalculation failed', { brandProfileId, error: err.message });
  }
};

const _onOrderDispatched = async (order, brandProfileId) => {
  try {
    // 1 — Update brand's average dispatch days
    await _updateAvgDispatchDays(brandProfileId, order.createdAt);

    // 2 — Issue referral reward if this is the brand's first confirmed dispatched order
    const dispatchedCount = await prisma.order.count({
      where: { brandProfileId, status: 'DISPATCHED' },
    });
    if (dispatchedCount === 1) {
      const { processReferralReward } = await import('../referrals/index.js');
      await processReferralReward(brandProfileId);
    }

    // 3 — Business verification: auto-verify buyer after their first dispatched order
    await _triggerBuyerVerification(order.buyerUserId);

    // 4 — Push order to Shopify if brand has a connected store
    const { pushOrderToShopify } = await import('../shopify/index.js');
    await pushOrderToShopify(order).catch(() => {});

    // 5 — Dispatch email notification to buyer
    const [buyer, brand] = await Promise.all([
      prisma.user.findUnique({ where: { id: order.buyerUserId }, select: { email: true, name: true } }),
      prisma.brandProfile.findUnique({ where: { id: brandProfileId }, select: { brandName: true } }),
    ]);
    const zone = order.shippingZone;
    const { SHIPPING_ZONES } = await import('../../shared/constants/shipping.js');
    const estimatedDelivery = SHIPPING_ZONES[zone]?.estimatedDelivery;

    await sendDispatchNotificationBuyer(buyer.email, {
      buyerName: buyer.name,
      brandName: brand.brandName,
      orderId: order.id,
      trackingNumber: order.trackingNumber,
      trackingCarrier: order.trackingCarrier,
      estimatedDelivery,
    }).catch(() => {});
  } catch (err) {
    logger.error('Post-dispatch triggers failed', { orderId: order.id, error: err.message });
  }
};

const _updateAvgDispatchDays = async (brandProfileId, orderCreatedAt) => {
  const brand = await prisma.brandProfile.findUnique({
    where: { id: brandProfileId },
    select: { avgDispatchDays: true, confirmedOrderCount: true },
  });

  const dispatchDays = (Date.now() - new Date(orderCreatedAt).getTime()) / (1000 * 60 * 60 * 24);
  const orderCount = Math.max(brand.confirmedOrderCount, 1);
  const newAvg = parseFloat(
    (((brand.avgDispatchDays ?? 0) * (orderCount - 1) + dispatchDays) / orderCount).toFixed(2)
  );

  await prisma.brandProfile.update({
    where: { id: brandProfileId },
    data: { avgDispatchDays: newAvg },
  });
};

const _triggerBuyerVerification = async (buyerUserId) => {
  const profile = await prisma.buyerProfile.findUnique({ where: { userId: buyerUserId } });
  if (!profile || profile.businessVerified) return;

  await prisma.buyerProfile.update({
    where: { userId: buyerUserId },
    data: { businessVerified: true, businessVerifiedAt: new Date() },
  });
  logger.info('Buyer business verified after first dispatched order', { buyerUserId });
};

export const listBrandOrders = async (brandUserId, { page, limit, status, search, isManualOrder, shareLinkId, dateFrom, dateTo }) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId: brandUserId } });
  if (!brand) throw createError('Brand profile not found', 404);

  const where = { brandProfileId: brand.id };
  if (status) where.status = status;
  if (isManualOrder !== undefined) where.isManualOrder = isManualOrder;
  if (shareLinkId) where.shareLinkId = shareLinkId;
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo);
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: { select: { name: true, slug: true } } } },
        buyer: { select: { name: true, email: true, buyerProfile: { select: { businessName: true, countryCode: true } } } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const listBuyerOrders = async (buyerUserId, { page, limit, status }) => {
  const where = { buyerUserId };
  if (status) where.status = status;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: { select: { name: true, slug: true, photos: { take: 1 } } } } },
        brand: { select: { brandName: true, slug: true, logoUrl: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getOrderById = async (userId, orderId, role) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: { select: { name: true, slug: true, weightGrams: true } } } },
      buyer: { select: { name: true, email: true, buyerProfile: { select: { businessName: true, countryCode: true } } } },
      brand: { select: { brandName: true, slug: true, logoUrl: true } },
      returns: true,
    },
  });

  if (!order) throw createError('Order not found', 404);

  if (role === 'BUYER' && order.buyerUserId !== userId) throw createError('You can only view orders you placed.', 403);
  if (role === 'BRAND') {
    const brand = await prisma.brandProfile.findUnique({ where: { userId } });
    if (!brand || order.brandProfileId !== brand.id) throw createError('You can only access orders belonging to your brand.', 403);
  }

  return order;
};
