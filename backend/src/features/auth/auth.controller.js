import * as authService from './auth.service.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { env } from '../../config/env.js';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export const buyerSignup = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerBuyer(req.body);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, { accessToken, user: sanitizeUser(user) }, 'Account created', 201);
};

export const brandSignup = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerBrand(req.body);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, { accessToken, user: sanitizeUser(user) }, 'Brand registered — pending admin approval', 201);
};

export const login = async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, { accessToken, user: sanitizeUser(user) });
};

export const verifyEmail = async (req, res) => {
  await authService.confirmEmailOtp(req.body);
  sendSuccess(res, null, 'Email verified successfully');
};

export const resendOtp = async (req, res) => {
  await authService.resendOtp(req.body.email);
  sendSuccess(res, null, 'OTP sent');
};

export const saveStoreTypeQuiz = async (req, res) => {
  const profile = await authService.saveStoreTypeQuiz(req.user.id, req.body);
  sendSuccess(res, profile, 'Preferences saved');
};

export const refreshToken = async (req, res) => {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ success: false, message: 'No refresh token' });

  const { accessToken, refreshToken: newRefresh } = await authService.refreshAccessToken(token);
  res.cookie('refreshToken', newRefresh, REFRESH_COOKIE_OPTIONS);
  sendSuccess(res, { accessToken });
};

export const logout = async (req, res) => {
  const token = req.cookies?.refreshToken;
  await authService.logout(token);
  res.clearCookie('refreshToken');
  sendSuccess(res, null, 'Logged out');
};

export const forgotPassword = async (req, res) => {
  await authService.sendForgotPasswordOtp(req.body.email);
  sendSuccess(res, null, 'If that email exists, an OTP has been sent');
};

export const resetPassword = async (req, res) => {
  await authService.resetPassword(req.body);
  sendSuccess(res, null, 'Password reset successfully');
};

export const getMe = (req, res) => {
  sendSuccess(res, sanitizeUser(req.user));
};

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
  avatarUrl: user.avatarUrl,
});
