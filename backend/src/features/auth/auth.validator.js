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
  countryOfOrigin: z.string().length(2).default('IN'),
  gstNumber: z.string().optional(),
  businessRegNumber: z.string().optional(),
  instagramHandle: z.string().optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  yearFounded: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  brandStory: z.string().max(1000).optional(),
  existingRetailPartners: z.string().max(500).optional(),
  referralToken: z.string().optional(),
}).refine((d) => d.gstNumber || d.businessRegNumber, {
  message: 'Either GST number or business registration number is required',
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
