import bcrypt from 'bcryptjs';
import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';

const ATTRIBUTION_WINDOW_DAYS = 30;
const SALT_ROUNDS = 10;

export const createShareLink = async (userId, data) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);
  if (brand.achievementLevel === null) throw createError('Reach Level 1 to create share links', 403);

  if (data.slug) {
    const existing = await prisma.shareLink.findUnique({ where: { slug: data.slug } });
    if (existing) throw createError('Slug already taken', 409);
  }

  // Hash password if provided
  const createData = { ...data, brandProfileId: brand.id };
  if (data.password) {
    createData.password = await bcrypt.hash(data.password, SALT_ROUNDS);
  }

  return prisma.shareLink.create({ data: createData });
};

/**
 * Resolves a share link by token.
 * If the link is password-protected, `inputPassword` must be provided.
 * Returns the link data without the hashed password field.
 */
export const getShareLinkByToken = async (token, inputPassword) => {
  const link = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      brandProfile: {
        select: { brandName: true, slug: true, logoUrl: true, achievementLevel: true },
      },
    },
  });
  if (!link) throw createError('Share link not found', 404);
  if (!link.isActive) throw createError('Share link is inactive', 410);
  if (link.expiresAt && link.expiresAt < new Date()) {
    await prisma.shareLink.update({ where: { id: link.id }, data: { isActive: false } });
    throw createError('Share link has expired', 410);
  }

  // Password-protected link
  if (link.password) {
    if (!inputPassword) throw createError('This share link requires a password', 403);
    const valid = await bcrypt.compare(inputPassword, link.password);
    if (!valid) throw createError('Incorrect share link password', 403);
  }

  // Strip the password hash from the response
  const { password: _pwd, ...safeLink } = link;
  return safeLink;
};

export const recordVisit = async (token, isUnique) => {
  await prisma.shareLink.update({
    where: { token },
    data: {
      viewCount: { increment: 1 },
      ...(isUnique && { uniqueVisitors: { increment: 1 } }),
    },
  });
};

export const recordSignupAttribution = async (token, userId) => {
  const link = await prisma.shareLink.findUnique({ where: { token } });
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

  return prisma.shareLink.findMany({
    where: { brandProfileId: brand.id },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateShareLink = async (userId, linkId, data) => {
  const link = await getOwnedLink(userId, linkId);
  return prisma.shareLink.update({
    where: { id: link.id },
    data,
  });
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
