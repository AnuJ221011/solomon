import bcrypt from 'bcryptjs';
import prisma from '../../config/db.js';
import {
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
  verifyRefreshToken,
  invalidateRefreshToken,
} from '../../shared/utils/token.js';
import { generateOtp, storeOtp, verifyOtp } from '../../shared/utils/otp.js';
import { sendOtpEmail, sendWelcomeEmail } from '../../shared/utils/email.js';
import { createError } from '../../shared/utils/createError.js';
import { recordSignupAttribution } from '../share-links/shareLink.service.js';
import { recordReferralSignup } from '../referrals/referral.service.js';

const SALT_ROUNDS = 12;

export const registerBuyer = async ({
  email, password, businessName, countryCode, phone,
  storeType, aesthetic, categoryInterests,
  shareLinkToken, referralToken,
}) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw createError('Email already registered', 409);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: businessName,
      role: 'BUYER',
      buyerProfile: {
        create: {
          businessName,
          countryCode,
          phone,
          storeType: storeType ?? null,
          aesthetic: aesthetic ?? null,
          categoryInterests: categoryInterests ?? [],
        },
      },
      wallet: { create: {} },
      cart: { create: {} },
    },
  });

  if (shareLinkToken) {
    await recordSignupAttribution(shareLinkToken, user.id).catch(() => {});
  }

  if (referralToken) {
    await recordReferralSignup(referralToken, user.id).catch(() => {});
  }

  const otp = generateOtp();
  await storeOtp(email, otp);
  await sendOtpEmail(email, otp);

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = await generateRefreshToken(user.id);
  return { user, accessToken, refreshToken };
};

export const registerBrand = async ({
  email, password, brandName, category, countryOfOrigin,
  gstNumber, businessRegNumber,
  instagramHandle, websiteUrl, yearFounded, brandStory, existingRetailPartners,
  referralToken,
}) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw createError('Email already registered', 409);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const slug = `${brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: brandName,
      role: 'BRAND',
      brandProfile: {
        create: {
          brandName,
          slug,
          category,
          countryOfOrigin,
          gstNumber,
          businessRegNumber,
          instagramHandle,
          websiteUrl: websiteUrl || null,
          yearFounded,
          brandStory,
          existingRetailPartners,
        },
      },
    },
  });

  if (referralToken) {
    await recordReferralSignup(referralToken, user.id).catch(() => {});
  }

  const otp = generateOtp();
  await storeOtp(email, otp);
  sendOtpEmail(email, otp).catch(() => {}); // non-blocking

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = await generateRefreshToken(user.id);
  return { user, accessToken, refreshToken };
};

export const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) throw createError('No account found with this email.', 401);
  if (!user.isActive) throw createError('Your account has been suspended.', 403);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw createError('Incorrect password.', 401);

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = await generateRefreshToken(user.id);
  return { user, accessToken, refreshToken };
};

export const confirmEmailOtp = async ({ email, otp }) => {
  const result = await verifyOtp(email, otp);
  if (!result.success) {
    if (result.reason === 'locked_out') throw createError('Account locked. Try again in 15 minutes.', 429);
    if (result.reason === 'expired') throw createError('OTP expired. Request a new one.', 410);
    throw createError(`Invalid OTP. ${result.attemptsLeft} attempt(s) remaining.`, 400);
  }

  const user = await prisma.user.update({
    where: { email },
    data: { isEmailVerified: true },
  });

  await sendWelcomeEmail(email, user.name);
  return user;
};

export const resendOtp = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw createError('No account found with this email address.', 404);
  if (user.isEmailVerified) throw createError('Email already verified', 400);

  const otp = generateOtp();
  await storeOtp(email, otp);
  sendOtpEmail(email, otp).catch(() => {}); // non-blocking
};

export const saveStoreTypeQuiz = async (userId, { storeType, aesthetic, categoryInterests }) => {
  return prisma.buyerProfile.update({
    where: { userId },
    data: { storeType, aesthetic, categoryInterests },
  });
};

export const refreshAccessToken = async (refreshToken) => {
  const userId = await verifyRefreshToken(refreshToken);
  if (!userId) throw createError('Invalid or expired refresh token', 401);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) throw createError('User not found or suspended', 401);

  const newRefreshToken = await rotateRefreshToken(refreshToken, userId);
  const accessToken = generateAccessToken(userId, user.role);
  return { accessToken, refreshToken: newRefreshToken };
};

export const logout = async (refreshToken) => {
  if (refreshToken) await invalidateRefreshToken(refreshToken);
};

export const sendForgotPasswordOtp = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return;

  const otp = generateOtp();
  await storeOtp(`reset:${email}`, otp);
  await sendOtpEmail(email, otp);
};

export const resetPassword = async ({ email, otp, newPassword }) => {
  const result = await verifyOtp(`reset:${email}`, otp);
  if (!result.success) {
    if (result.reason === 'locked_out') throw createError('Too many attempts. Try again in 15 minutes.', 429);
    if (result.reason === 'expired') throw createError('OTP expired.', 410);
    throw createError(`Invalid OTP. ${result.attemptsLeft} attempt(s) remaining.`, 400);
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { email }, data: { passwordHash } });
};
