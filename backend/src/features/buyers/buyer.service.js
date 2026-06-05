import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';

// ── Cart ──────────────────────────────────────────────────────

export const getCart = async (userId) => {
  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              photos: { orderBy: { position: 'asc' }, take: 1 },
              brandProfile: { select: { id: true, brandName: true, slug: true, achievementLevel: true } },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!cart) {
    return prisma.cart.create({ where: { userId }, data: { userId }, include: { items: true } });
  }
  return cart;
};

export const upsertCartItem = async (userId, { productId, quantity, variantOptions }) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.availability !== 'ACTIVE') throw createError('Product not available', 404);
  if (quantity < product.moq) throw createError(`Minimum order quantity is ${product.moq}`, 400);

  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });

  return prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    create: { cartId: cart.id, productId, quantity, variantOptions },
    update: { quantity, variantOptions },
    include: { product: { include: { photos: { take: 1 } } } },
  });
};

export const removeCartItem = async (userId, productId) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw createError('Cart not found', 404);
  await prisma.cartItem.delete({ where: { cartId_productId: { cartId: cart.id, productId } } });
};

export const clearCart = async (userId) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
};

// ── Saved items ───────────────────────────────────────────────

export const saveProduct = async (userId, productId) => {
  const profile = await prisma.buyerProfile.findUnique({ where: { userId } });
  if (!profile) throw createError('Buyer profile not found', 404);
  return prisma.savedProduct.upsert({
    where: { buyerProfileId_productId: { buyerProfileId: profile.id, productId } },
    create: { buyerProfileId: profile.id, productId },
    update: {},
  });
};

export const unsaveProduct = async (userId, productId) => {
  const profile = await prisma.buyerProfile.findUnique({ where: { userId } });
  if (!profile) throw createError('Buyer profile not found', 404);
  await prisma.savedProduct.delete({
    where: { buyerProfileId_productId: { buyerProfileId: profile.id, productId } },
  }).catch(() => {});
};

export const saveBrand = async (userId, brandProfileId) => {
  const profile = await prisma.buyerProfile.findUnique({ where: { userId } });
  if (!profile) throw createError('Buyer profile not found', 404);
  return prisma.savedBrand.upsert({
    where: { buyerProfileId_brandProfileId: { buyerProfileId: profile.id, brandProfileId } },
    create: { buyerProfileId: profile.id, brandProfileId },
    update: {},
  });
};

export const unsaveBrand = async (userId, brandProfileId) => {
  const profile = await prisma.buyerProfile.findUnique({ where: { userId } });
  if (!profile) throw createError('Buyer profile not found', 404);
  await prisma.savedBrand.delete({
    where: { buyerProfileId_brandProfileId: { buyerProfileId: profile.id, brandProfileId } },
  }).catch(() => {});
};

export const getSavedItems = async (userId) => {
  const profile = await prisma.buyerProfile.findUnique({
    where: { userId },
    include: {
      savedProducts: {
        include: {
          product: {
            include: {
              photos: { orderBy: { position: 'asc' }, take: 1 },
              brandProfile: { select: { brandName: true, slug: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      savedBrands: {
        include: {
          buyer: false,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!profile) throw createError('Buyer profile not found', 404);

  const savedBrandDetails = await Promise.all(
    profile.savedBrands.map((sb) =>
      prisma.brandProfile.findUnique({
        where: { id: sb.brandProfileId },
        select: { id: true, brandName: true, slug: true, logoUrl: true, achievementLevel: true },
      })
    )
  );

  return {
    products: profile.savedProducts.map((sp) => sp.product),
    brands: savedBrandDetails.filter(Boolean),
  };
};

// ── Dashboard ─────────────────────────────────────────────────

export const getBuyerDashboard = async (userId) => {
  const profile = await prisma.buyerProfile.findUnique({ where: { userId } });
  if (!profile) throw createError('Buyer profile not found', 404);

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
    include: {
      credits: {
        where: { status: 'ACTIVE', expiresAt: { gte: new Date() } },
        orderBy: { expiresAt: 'asc' },
      },
    },
  });

  const [recentOrders, referrals] = await Promise.all([
    prisma.order.findMany({
      where: { buyerUserId: userId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { brand: { select: { brandName: true, slug: true } } },
    }),
    prisma.buyerReferral.findMany({
      where: { referrerUserId: userId },
      include: { referredBrand: { select: { brandName: true, achievementLevel: true } } },
    }),
  ]);

  return {
    profile,
    wallet: { balanceInr: wallet?.balanceInr ?? 0, credits: wallet?.credits ?? [] },
    recentOrders,
    referralStats: {
      totalReferrals: referrals.length,
      rewardsEarned: referrals.filter((r) => r.rewardIssued).length,
      bonusEarned: referrals.filter((r) => r.bonusIssued).length,
    },
  };
};
