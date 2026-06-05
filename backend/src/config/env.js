import 'dotenv/config';

const required = (key) => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
};

const optional = (key, fallback) => process.env[key] ?? fallback;

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '5000'), 10),

  DATABASE_URL: required('DATABASE_URL'),

  REDIS_URL: optional('REDIS_URL', 'redis://localhost:6379'),

  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN: optional('JWT_ACCESS_EXPIRES_IN', '15m'),
  JWT_REFRESH_EXPIRES_IN: optional('JWT_REFRESH_EXPIRES_IN', '30d'),

  // Google OAuth — deferred to Phase 2
  // GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL

  // Optional until accounts are created — features degrade gracefully when empty
  RESEND_API_KEY: optional('RESEND_API_KEY', ''),
  EMAIL_FROM: optional('EMAIL_FROM', 'noreply@solomonbharat.com'),

  CLOUDINARY_CLOUD_NAME: optional('CLOUDINARY_CLOUD_NAME', ''),
  CLOUDINARY_API_KEY: optional('CLOUDINARY_API_KEY', ''),
  CLOUDINARY_API_SECRET: optional('CLOUDINARY_API_SECRET', ''),

  // FX rates use Frankfurter (free, no API key — https://www.frankfurter.app)

  IPAPI_KEY: optional('IPAPI_KEY', ''),

  // Payment provider — to be replaced with chosen provider
  PAYPAL_CLIENT_ID: optional('PAYPAL_CLIENT_ID', ''),
  PAYPAL_CLIENT_SECRET: optional('PAYPAL_CLIENT_SECRET', ''),
  PAYPAL_MODE: optional('PAYPAL_MODE', 'sandbox'),
  PAYPAL_WEBHOOK_ID: optional('PAYPAL_WEBHOOK_ID', ''),

  // Shiprocket (real-time shipping quotes)
  SHIPROCKET_EMAIL: optional('SHIPROCKET_EMAIL', ''),
  SHIPROCKET_PASSWORD: optional('SHIPROCKET_PASSWORD', ''),

  CLIENT_URL: optional('CLIENT_URL', 'http://localhost:3000'),

  OTP_EXPIRY_MINUTES: parseInt(optional('OTP_EXPIRY_MINUTES', '10'), 10),
  OTP_MAX_ATTEMPTS: parseInt(optional('OTP_MAX_ATTEMPTS', '3'), 10),
};
