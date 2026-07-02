import { z } from 'zod';
import { STORE_TYPES, AESTHETICS } from '../../shared/constants/roles.js';

export const buyerSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/\d/, 'Password must contain at least 1 number'),
  businessName: z.string().min(1).max(100),
  countryCode: z.string().length(2),
  phone: z.string().optional(),
  // Store type quiz — optional at signup, can be completed later
  storeType: z.enum(STORE_TYPES).optional(),
  aesthetic: z.enum(AESTHETICS).optional(),
  categoryInterests: z.array(z.string()).max(10).default([]),
  // Share link attribution token (passed from sessionStorage)
  shareLinkToken: z.string().optional(),
  // Referral token
  referralToken: z.string().optional(),
});

export const brandSignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/\d/, 'Password must contain at least 1 number'),
  brandName: z.string().min(1).max(100),
  category: z.array(z.string()).min(1),
  registrationType: z.enum(['individual', 'business']).optional(),
  countryOfOrigin: z.string().length(2).default('IN'),
  phone: z.string().optional(),
  tagline: z.string().max(120).optional(),
  instagramHandle: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  yearFounded: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  brandStory: z.string().max(1000).optional(),
  wholesaleProductCount: z.number().int().min(1).optional(),
  minimumOrderValue: z.number().int().min(1).optional(),
  leadTime: z.enum(['ONE_TO_THREE_DAYS', 'ONE_TO_TWO_WEEKS', 'TWO_TO_FOUR_WEEKS']).optional(),
  returnsWindowDays: z.number().int().min(1).max(365).optional(),
  shippingZones: z.array(z.string()).optional(),
  referralToken: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  newPassword: z.string().min(8).regex(/\d/, 'Password must contain at least 1 number'),
});

export const changePendingEmailSchema = z.object({
  currentEmail: z.string().email(),
  newEmail: z.string().email(),
});

export const storeTypeQuizSchema = z.object({
  storeType: z.enum(STORE_TYPES),
  aesthetic: z.enum(AESTHETICS),
  categoryInterests: z.array(z.string()).min(1).max(10),
});
