import bcrypt from 'bcryptjs';
import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';

const SALT_ROUNDS = 10;

// A share link is addressed by its custom `slug` when the brand set one,
// otherwise by its auto-generated `token` — every public/attribution lookup
// needs to accept either.
const findLinkByIdentifier = (identifier) =>
  prisma.shareLink.findFirst({ where: { OR: [{ slug: identifier }, { token: identifier }] } });

export const createShareLink = async (userId, data) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);
  if (brand.achievementLevel === null) throw createError('Reach Level 1 to create share links', 403);

  if (data.slug) {
    const existing = await prisma.shareLink.findUnique({ where: { slug: data.slug } });
    if (existing) throw createError('Slug already taken', 409);
  }

  if (data.productId) {
    const product = await prisma.product.findFirst({ where: { id: data.productId, brandProfileId: brand.id } });
    if (!product) throw createError('Product not found', 404);
  }
  if (data.collectionId) {
    const collection = await prisma.collection.findFirst({ where: { id: data.collectionId, brandProfileId: brand.id } });
    if (!collection) throw createError('Collection not found', 404);
  }

  const createData = { ...data, brandProfileId: brand.id };
  if (data.password) {
    createData.password = await bcrypt.hash(data.password, SALT_ROUNDS);
  }

  const link = await prisma.shareLink.create({ data: createData });
  const { password: _pwd, ...safeLink } = link;
  return safeLink;
};

/**
 * Resolves a share link for the public click-through page. Only returns
 * validity/branding info needed to send the visitor into the real brand or
 * product page — storefront/product rendering itself is never duplicated
 * here, it's owned by /brands/:slug and /products/:slug.
 */
export const getShareLinkForView = async (identifier, inputPassword) => {
  const link = await findLinkByIdentifier(identifier);
  if (!link) throw createError('Share link not found', 404);
  if (!link.isActive) throw createError('Share link is inactive', 410);
  if (link.expiresAt && link.expiresAt < new Date()) {
    await prisma.shareLink.update({ where: { id: link.id }, data: { isActive: false } });
    throw createError('Share link has expired', 410);
  }

  if (link.password) {
    if (!inputPassword) throw createError('This share link requires a password', 401);
    const valid = await bcrypt.compare(inputPassword, link.password);
    if (!valid) throw createError('Incorrect share link password', 401);
  }

  const brand = await prisma.brandProfile.findUnique({
    where: { id: link.brandProfileId },
    select: { slug: true },
  });

  let productSlug = null;
  if (link.target === 'PRODUCT' && link.productId) {
    const product = await prisma.product.findUnique({ where: { id: link.productId }, select: { slug: true } });
    productSlug = product?.slug ?? null;
  }

  return {
    id: link.id,
    name: link.name,
    target: link.target,
    active: link.isActive,
    passwordRequired: !!link.password,
    customMessage: link.customMessage,
    lockedCurrency: link.lockedCurrency,
    brandSlug: brand?.slug ?? null,
    productSlug,
  };
};

export const recordVisit = async (identifier, isUnique) => {
  const link = await findLinkByIdentifier(identifier);
  if (!link) return;
  await prisma.shareLink.update({
    where: { id: link.id },
    data: {
      viewCount: { increment: 1 },
      ...(isUnique && { uniqueVisitors: { increment: 1 } }),
    },
  });
};

export const recordSignupAttribution = async (identifier, userId) => {
  const link = await findLinkByIdentifier(identifier);
  if (!link) return;

  await prisma.$transaction([
    prisma.userShareLinkAttribution.upsert({
      where: { userId_shareLinkId: { userId, shareLinkId: link.id } },
      create: { userId, shareLinkId: link.id },
      update: {},
    }),
    prisma.shareLink.update({
      where: { id: link.id },
      data: { signupCount: { increment: 1 } },
    }),
  ]);
};

export const getMyShareLinks = async (userId) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);

  const links = await prisma.shareLink.findMany({
    where: { brandProfileId: brand.id },
    orderBy: { createdAt: 'desc' },
  });
  return links.map(({ password: _pwd, ...link }) => link);
};

export const updateShareLink = async (userId, linkId, data) => {
  const link = await getOwnedLink(userId, linkId);

  const updateData = { ...data };
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, SALT_ROUNDS);
  }

  const updated = await prisma.shareLink.update({ where: { id: link.id }, data: updateData });
  const { password: _pwd, ...safeLink } = updated;
  return safeLink;
};

export const deleteShareLink = async (userId, linkId) => {
  await getOwnedLink(userId, linkId);
  await prisma.shareLink.delete({ where: { id: linkId } });
};

const getOwnedLink = async (userId, linkId) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);

  const link = await prisma.shareLink.findFirst({
    where: { id: linkId, brandProfileId: brand.id },
  });
  if (!link) throw createError('Share link not found', 404);
  return link;
};
