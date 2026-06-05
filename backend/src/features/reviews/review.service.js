import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';

export const createReview = async (buyerUserId, { orderId, productId, rating, comment }) => {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw createError('Order not found', 404);
  if (order.buyerUserId !== buyerUserId) throw createError('Access denied', 403);
  if (order.status !== 'DELIVERED') throw createError('Can only review delivered orders', 400);

  const existing = await prisma.productReview.findUnique({
    where: { orderId_productId: { orderId, productId } },
  });
  if (existing) throw createError('You have already reviewed this product for this order', 409);

  const review = await prisma.productReview.create({
    data: { productId, orderId, reviewerUserId: buyerUserId, rating, comment },
  });

  // Recalculate brand avg rating
  await updateBrandAvgRating(order.brandProfileId);

  return review;
};

export const respondToReview = async (brandUserId, reviewId, brandResponse) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId: brandUserId } });
  if (!brand) throw createError('Brand profile not found', 404);

  const review = await prisma.productReview.findUnique({
    where: { id: reviewId },
    include: { product: { select: { brandProfileId: true } } },
  });
  if (!review) throw createError('Review not found', 404);
  if (review.product.brandProfileId !== brand.id) throw createError('Access denied', 403);

  return prisma.productReview.update({
    where: { id: reviewId },
    data: { brandResponse },
  });
};

export const editReview = async (buyerUserId, reviewId, { rating, comment }) => {
  const review = await prisma.productReview.findUnique({ where: { id: reviewId } });
  if (!review) throw createError('Review not found', 404);
  if (review.reviewerUserId !== buyerUserId) throw createError('Access denied', 403);

  const updated = await prisma.productReview.update({
    where: { id: reviewId },
    data: { rating, comment },
  });

  const order = await prisma.order.findUnique({ where: { id: review.orderId } });
  await updateBrandAvgRating(order.brandProfileId);

  return updated;
};

export const listProductReviews = async (productId, { page = 1, limit = 20 }) => {
  const [reviews, total] = await Promise.all([
    prisma.productReview.findMany({
      where: { productId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: { select: { name: true, buyerProfile: { select: { businessName: true, countryCode: true } } } },
      },
    }),
    prisma.productReview.count({ where: { productId } }),
  ]);

  return { reviews, total, page, limit, totalPages: Math.ceil(total / limit) };
};

const updateBrandAvgRating = async (brandProfileId) => {
  const result = await prisma.productReview.aggregate({
    where: { product: { brandProfileId } },
    _avg: { rating: true },
  });

  await prisma.brandProfile.update({
    where: { id: brandProfileId },
    data: { avgRating: result._avg.rating ?? 0 },
  });
};
