import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';
import { OPENING_ORDER_RETURN_DAYS } from '../../shared/constants/roles.js';
import { sendReturnRequestedEmail, sendReturnStatusEmail } from '../../shared/utils/email.js';

export const requestReturn = async (buyerUserId, orderId, { reason, photoUrls }) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { brand: { select: { brandName: true, user: { select: { email: true } } } } },
  });
  if (!order) throw createError('Order not found', 404);
  if (order.buyerUserId !== buyerUserId) throw createError('You can only request returns for orders you placed.', 403);
  if (order.status !== 'DELIVERED') throw createError('Only delivered orders can be returned', 400);

  const existingReturn = await prisma.return.findFirst({ where: { orderId } });
  if (existingReturn) throw createError('A return has already been requested for this order', 409);

  const isOpeningOrder = order.isOpeningOrder;
  if (isOpeningOrder) {
    const deliveredAt = order.deliveredAt ?? order.updatedAt;
    const daysSinceDelivery = (Date.now() - deliveredAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceDelivery > OPENING_ORDER_RETURN_DAYS) {
      throw createError(`Opening order return window (${OPENING_ORDER_RETURN_DAYS} days) has closed`, 400);
    }
  }

  const ret = await prisma.return.create({
    data: { orderId, requestedById: buyerUserId, reason, photoUrls: photoUrls ?? [], isOpeningOrder },
  });

  // Notify brand of return request
  await sendReturnRequestedEmail(order.brand.user.email, {
    brandName: order.brand.brandName,
    orderId,
    reason,
  }).catch(() => {});

  return ret;
};

export const updateReturnStatus = async (adminUserId, returnId, { status, adminNotes, returnLabelUrl }) => {
  const ret = await prisma.return.findUnique({
    where: { id: returnId },
    include: {
      order: {
        include: {
          buyer: { select: { email: true, name: true } },
        },
      },
    },
  });
  if (!ret) throw createError('Return not found', 404);

  const updated = await prisma.return.update({
    where: { id: returnId },
    data: {
      status,
      adminNotes,
      returnLabelUrl,
      resolvedAt: ['REFUNDED', 'REJECTED'].includes(status) ? new Date() : undefined,
    },
  });

  // Notify buyer of status change
  await sendReturnStatusEmail(ret.order.buyer.email, {
    buyerName: ret.order.buyer.name,
    orderId: ret.orderId,
    status,
    adminNotes,
  }).catch(() => {});

  return updated;
};

export const listReturns = async ({ orderId, status, page = 1, limit = 20 }) => {
  const where = {};
  if (orderId) where.orderId = orderId;
  if (status) where.status = status;

  const [returns, total] = await Promise.all([
    prisma.return.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true, totalInr: true, isOpeningOrder: true,
            brand: { select: { brandName: true } },
            buyer: { select: { name: true, buyerProfile: { select: { businessName: true } } } },
          },
        },
      },
    }),
    prisma.return.count({ where }),
  ]);

  return { returns, total, page, limit, totalPages: Math.ceil(total / limit) };
};
