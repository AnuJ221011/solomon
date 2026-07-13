import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';
import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../../config/db.js';
import redis from '../../config/redis.js';
import { env } from '../../config/env.js';
import {
  generateAccessToken,
  generateRefreshToken,
  rotateRefreshToken,
  verifyRefreshToken,
  invalidateRefreshToken,
} from '../../shared/utils/token.js';
import { generateOtp, storeOtp, verifyOtp } from '../../shared/utils/otp.js';
import { storePendingSignup, getPendingSignup, deletePendingSignup } from '../../shared/utils/pendingSignup.js';
import { sendOtpEmail, sendWelcomeEmail } from '../../shared/utils/email.js';
import { createError } from '../../shared/utils/createError.js';
import { recordSignupAttribution } from '../share-links/shareLink.service.js';
import { recordReferralSignup } from '../referrals/referral.service.js';
import { cloudinaryFolders } from '../../shared/constants/cloudinary.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

// Upload a single file buffer to Cloudinary and return the secure URL.
// public_id + tags make the asset identifiable/searchable directly in the
// Cloudinary dashboard — without them every upload gets a random filename
// with no indication of which brand or document type it belongs to.
function uploadDoc(buffer, folder, publicId, tags) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto', type: 'upload', access_mode: 'public', public_id: publicId, tags },
      (err, result) => (err ? reject(err) : resolve(result.secure_url)),
    );
    stream.end(buffer);
  });
}

// Upload all document files (req.files map) and return a URL map.
// brandNameHint is the brand name submitted at signup — the real BrandProfile
// row (and its slug) doesn't exist yet at this point in the flow, so we build
// a throwaway slug just for naming these uploads.
async function uploadDocs(files = {}, brandNameHint = 'brand') {
  const slugHint = brandNameHint.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'brand';
  const uploads = {};
  const map = {
    brandLogo: { urlKey: 'logoUrl', tag: 'brand-logo' },
    brandBanner: { urlKey: 'bannerUrl', tag: 'brand-banner' },
    aadhar: { urlKey: 'aadharUrl', tag: 'aadhar-card' },
    pan: { urlKey: 'panUrl', tag: 'pan-card' },
    gstCert: { urlKey: 'gstCertUrl', tag: 'gst-certificate' },
    incorporateCert: { urlKey: 'incorporateCertUrl', tag: 'incorporation-certificate' },
    msmeCert: { urlKey: 'msmeCertUrl', tag: 'msme-certificate' },
    isoCert: { urlKey: 'isoCertUrl', tag: 'iso-certificate' },
    iecCert: { urlKey: 'iecCertUrl', tag: 'iec-certificate' },
  };
  await Promise.all(
    Object.entries(map).map(async ([field, { urlKey, tag }]) => {
      const file = files[field]?.[0];
      if (file) {
        const publicId = `${slugHint}-${tag}-${Date.now()}`;
        uploads[urlKey] = await uploadDoc(file.buffer, cloudinaryFolders.docs, publicId, ['brand-onboarding', tag, slugHint]);
      }
    }),
  );
  return uploads;
}

const SALT_ROUNDS = env.BCRYPT_SALT_ROUNDS;

// Step 1 of buyer signup — the account is NOT created yet. The submitted
// form (with the password already hashed) is held in Redis until the buyer
// proves they own the email address; only verifyBuyerSignup() below actually
// creates the User row.
export const initiateBuyerSignup = async ({
  email, password, businessName, countryCode, phone,
  storeType, aesthetic, categoryInterests,
  shareLinkToken, referralToken,
}) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw createError('Email already registered', 409);

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await storePendingSignup(email, {
    email,
    passwordHash,
    businessName,
    countryCode,
    phone,
    storeType: storeType ?? null,
    aesthetic: aesthetic ?? null,
    categoryInterests: categoryInterests ?? [],
    shareLinkToken: shareLinkToken ?? null,
    referralToken: referralToken ?? null,
  });

  const otp = generateOtp();
  await storeOtp(email, otp);
  await sendOtpEmail(email, otp);
};

// Step 2 of buyer signup — verifies the code, then creates the account from
// the data stashed by initiateBuyerSignup(). This is the only place a BUYER
// User row gets created, so every buyer account that exists is, by
// construction, already email-verified.
export const verifyBuyerSignup = async ({ email, otp }) => {
  const result = await verifyOtp(email, otp);
  if (!result.success) {
    if (result.reason === 'locked_out') throw createError('Account locked. Try again in 15 minutes.', 429);
    if (result.reason === 'expired') throw createError('Code expired. Please sign up again.', 410);
    throw createError(`Invalid code. ${result.attemptsLeft} attempt(s) remaining.`, 400);
  }

  const pending = await getPendingSignup(email);
  if (!pending) throw createError('Signup session expired. Please sign up again.', 410);

  // Guard against the email being registered by another flow while this
  // signup's code was in flight.
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await deletePendingSignup(email);
    throw createError('Email already registered', 409);
  }

  const user = await prisma.user.create({
    data: {
      email: pending.email,
      passwordHash: pending.passwordHash,
      name: pending.businessName,
      role: 'BUYER',
      isEmailVerified: true,
      buyerProfile: {
        create: {
          businessName: pending.businessName,
          countryCode: pending.countryCode,
          phone: pending.phone,
          storeType: pending.storeType,
          aesthetic: pending.aesthetic,
          categoryInterests: pending.categoryInterests,
        },
      },
      wallet: { create: {} },
      cart: { create: {} },
    },
  });

  await deletePendingSignup(email);

  if (pending.shareLinkToken) {
    await recordSignupAttribution(pending.shareLinkToken, user.id).catch(() => {});
  }
  if (pending.referralToken) {
    await recordReferralSignup(pending.referralToken, user.id).catch(() => {});
  }

  await sendWelcomeEmail(email, user.name).catch(() => {});

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = await generateRefreshToken(user.id);
  return { user, accessToken, refreshToken };
};

async function generateBrandDescription(brandStory) {
  if (!env.GEMINI_API_KEY) return null;
  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Write a short 1–2 sentence brand description (under 160 characters) for a wholesale marketplace brand, based on their brand story. Be concise, professional, and buyer-focused. Return only the description text with no quotes or extra formatting.\n\nBrand story: ${brandStory}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().slice(0, 200);
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

const BRAND_EMAIL_VERIFIED_PREFIX = 'brand_email_verified:';
// Long enough to cover the rest of the onboarding wizard (brand info,
// documents, bank details) after the email is confirmed up front.
const BRAND_EMAIL_VERIFIED_TTL_SECONDS = 60 * 60;

// Step 1 of brand onboarding — sent right after "Create your account"
// (email/password/phone), before any brand or business details are
// collected. No account or pending signup data exists yet; this only
// proves the brand owns the email address before they continue the wizard.
export const requestBrandEmailOtp = async (email) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw createError('Email already registered', 409);

  const otp = generateOtp();
  await storeOtp(email, otp);
  await sendOtpEmail(email, otp);
};

// Step 2 — confirms the code and marks the email verified for the rest of
// the wizard. registerBrand() below checks this marker instead of asking
// for a second code once the full application is submitted.
export const verifyBrandEmailOtp = async ({ email, otp }) => {
  const result = await verifyOtp(email, otp);
  if (!result.success) {
    if (result.reason === 'locked_out') throw createError('Account locked. Try again in 15 minutes.', 429);
    if (result.reason === 'expired') throw createError('Code expired. Please request a new one.', 410);
    throw createError(`Invalid code. ${result.attemptsLeft} attempt(s) remaining.`, 400);
  }
  await redis.setex(`${BRAND_EMAIL_VERIFIED_PREFIX}${email}`, BRAND_EMAIL_VERIFIED_TTL_SECONDS, '1');
};

// Final step — the full brand application (documents, business info, bank
// details). Requires the email to have already been verified via
// requestBrandEmailOtp/verifyBrandEmailOtp earlier in the wizard, so no
// further OTP prompt is needed here; the account is created verified.
export const registerBrand = async ({
  email, password, brandName, category, countryOfOrigin,
  registrationType, phone, tagline,
  instagramHandle, websiteUrl, city, state, yearFounded, brandStory,
  wholesaleProductCount, minimumOrderValue, leadTime, shippingZones,
  returnsWindowDays,
  bankAccountHolderName, bankName, bankAccountNumber,
  bankIfscCode, bankAccountType, bankUpiId,
  referralToken,
  files, // multer req.files — uploaded document buffers
}) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw createError('Email already registered', 409);

  const verifiedKey = `${BRAND_EMAIL_VERIFIED_PREFIX}${email}`;
  const emailVerified = await redis.get(verifiedKey);
  if (!emailVerified) throw createError('Please verify your email before completing your application.', 400);

  const [docUrls, aiDescription] = await Promise.all([
    env.CLOUDINARY_CLOUD_NAME ? uploadDocs(files, brandName).catch(() => ({})) : Promise.resolve({}),
    brandStory ? generateBrandDescription(brandStory) : Promise.resolve(null),
  ]);

  const profileData = {
    brandName,
    category,
    countryOfOrigin: countryOfOrigin ?? 'IN',
    registrationType: registrationType ?? 'individual',
    tagline: tagline ?? null,
    phone: phone ?? null,
    instagramHandle: instagramHandle ?? null,
    websiteUrl: websiteUrl || null,
    city: city ?? null,
    state: state ?? null,
    yearFounded: yearFounded ?? null,
    brandStory: brandStory ?? null,
    description: aiDescription ?? null,
    wholesaleProductCount: wholesaleProductCount ?? null,
    minimumOrderValue: minimumOrderValue ?? 0,
    defaultLeadTime: leadTime ?? null,
    defaultShippingZones: shippingZones ?? [],
    returnsWindowDays: returnsWindowDays ?? null,
    ...docUrls,
  };

  const bankData = bankAccountHolderName && bankName && bankAccountNumber && bankIfscCode
    ? {
        accountHolderName: bankAccountHolderName,
        bankName,
        accountNumber: bankAccountNumber,
        ifscCode: bankIfscCode,
        accountType: bankAccountType ?? 'SAVINGS',
        upiId: bankUpiId || null,
      }
    : null;

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const slug = `${brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: brandName,
      role: 'BRAND',
      isEmailVerified: true,
      brandProfile: {
        create: {
          ...profileData,
          slug,
          ...(bankData && { bankAccount: { create: bankData } }),
        },
      },
    },
  });

  await redis.del(verifiedKey);

  if (referralToken) {
    await recordReferralSignup(referralToken, user.id).catch(() => {});
  }

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

// Alternate to password login — sends a one-time code instead. Silent on a
// missing account so the response can't be used to enumerate registered
// emails, same posture as sendForgotPasswordOtp below.
export const requestLoginOtp = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash || !user.isActive) return;

  const otp = generateOtp();
  await storeOtp(`login:${email}`, otp);
  await sendOtpEmail(email, otp);
};

// Verifies the login code and issues the exact same session as password
// login, so either method leads to the same signed-in result.
export const loginWithOtp = async ({ email, otp }) => {
  const result = await verifyOtp(`login:${email}`, otp);
  if (!result.success) {
    if (result.reason === 'locked_out') throw createError('Too many attempts. Try again in 15 minutes.', 429);
    if (result.reason === 'expired') throw createError('Code expired. Please request a new one.', 410);
    throw createError(`Invalid code. ${result.attemptsLeft} attempt(s) remaining.`, 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw createError('No account found with this email.', 401);

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

export const changePendingEmail = async ({ currentEmail, newEmail }) => {
  const user = await prisma.user.findUnique({ where: { email: currentEmail } });
  if (!user) throw createError('No account found with this email.', 404);
  if (user.isEmailVerified) throw createError('This account is already verified.', 400);

  const taken = await prisma.user.findUnique({ where: { email: newEmail } });
  if (taken) throw createError('This email is already registered.', 409);

  await prisma.user.update({ where: { email: currentEmail }, data: { email: newEmail } });
};

export const resendOtp = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    if (user.isEmailVerified) throw createError('Email already verified', 400);
    const otp = generateOtp();
    await storeOtp(email, otp);
    sendOtpEmail(email, otp).catch(() => {}); // non-blocking
    return;
  }

  // No account yet — this is a buyer signup still awaiting verification.
  const pending = await getPendingSignup(email);
  if (!pending) throw createError('No account found with this email address.', 404);

  const otp = generateOtp();
  await storeOtp(email, otp);
  sendOtpEmail(email, otp).catch(() => {});
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
