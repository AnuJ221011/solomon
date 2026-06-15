import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';

// ── Profile ───────────────────────────────────────────────────

export const getProfile = async (userId) => {
  const profile = await prisma.buyerProfile.findUnique({ where: { userId } });
  if (!profile) throw createError('Buyer profile not found', 404);
  return profile;
};

export const updateProfile = async (userId, body) => {
  const { businessName, phone, addressLine, city, state, postalCode, countryCode, preferredCurrency, storeType, notifNewArrivals, notifOrderUpdates, notifPromotions } = body;

  const profile = await prisma.buyerProfile.update({
    where: { userId },
    data: {
      ...(businessName   !== undefined && { businessName }),
      ...(phone          !== undefined && { phone }),
      ...(addressLine    !== undefined && { addressLine }),
      ...(city           !== undefined && { city }),
      ...(state          !== undefined && { state }),
      ...(postalCode     !== undefined && { postalCode }),
      ...(countryCode    !== undefined && { countryCode }),
      ...(preferredCurrency !== undefined && { preferredCurrency }),
      ...(storeType         !== undefined && { storeType }),
      ...(notifNewArrivals  !== undefined && { notifNewArrivals }),
      ...(notifOrderUpdates !== undefined && { notifOrderUpdates }),
      ...(notifPromotions   !== undefined && { notifPromotions }),
    },
  });

  return profile;
};

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
          variant: { include: { attributes: true } },
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

export const upsertCartItem = async (userId, { productId, variantId, quantity }) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  });
  if (!product || product.availability !== 'ACTIVE') throw createError('Product not available', 404);
  if (quantity < product.moq) throw createError(`Minimum order quantity is ${product.moq}`, 400);

  // If product has variants, a variantId must be provided
  if (product.variants.length > 0 && !variantId) {
    throw createError('This product has variants — please select one', 400);
  }

  // Validate variant belongs to this product and is available
  if (variantId) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (!variant) throw createError('Variant not found for this product', 404);
    if (variant.status === 'INACTIVE') throw createError('This variant is currently unavailable', 400);
    if (variant.status === 'OUT_OF_STOCK' || variant.stock < quantity) {
      throw createError(`Insufficient stock — only ${variant.stock} units available`, 400);
    }
  }

  let cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) cart = await prisma.cart.create({ data: { userId } });

  // Find existing item (match on productId + variantId — null variantId for variant-free products)
  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId: variantId ?? null },
  });

  if (existing) {
    return prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity },
      include: { product: { include: { photos: { take: 1 } } }, variant: { include: { attributes: true } } },
    });
  }

  return prisma.cartItem.create({
    data: { cartId: cart.id, productId, variantId: variantId ?? null, quantity },
    include: { product: { include: { photos: { take: 1 } } }, variant: { include: { attributes: true } } },
  });
};

export const removeCartItem = async (userId, productId, variantId) => {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) throw createError('Cart not found', 404);

  const item = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId, variantId: variantId ?? null },
  });
  if (!item) throw createError('Item not in cart', 404);
  await prisma.cartItem.delete({ where: { id: item.id } });
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
