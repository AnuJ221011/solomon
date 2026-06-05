import crypto from 'crypto';
import redis from '../../config/redis.js';
import { env } from '../../config/env.js';

const OTP_PREFIX = 'otp:';
const OTP_ATTEMPTS_PREFIX = 'otp_attempts:';
const LOCKOUT_PREFIX = 'otp_lockout:';

export const generateOtp = () =>
  crypto.randomInt(100000, 999999).toString();

export const storeOtp = async (identifier, otp) => {
  const ttlSeconds = env.OTP_EXPIRY_MINUTES * 60;
  await redis.setex(`${OTP_PREFIX}${identifier}`, ttlSeconds, otp);
  await redis.del(`${OTP_ATTEMPTS_PREFIX}${identifier}`);
};

export const verifyOtp = async (identifier, inputOtp) => {
  const lockoutKey = `${LOCKOUT_PREFIX}${identifier}`;
  const attemptsKey = `${OTP_ATTEMPTS_PREFIX}${identifier}`;

  const isLockedOut = await redis.get(lockoutKey);
  if (isLockedOut) return { success: false, reason: 'locked_out' };

  const storedOtp = await redis.get(`${OTP_PREFIX}${identifier}`);
  if (!storedOtp) return { success: false, reason: 'expired' };

  if (storedOtp !== inputOtp) {
    const attempts = await redis.incr(attemptsKey);
    await redis.expire(attemptsKey, env.OTP_EXPIRY_MINUTES * 60);

    if (attempts >= env.OTP_MAX_ATTEMPTS) {
      await redis.setex(lockoutKey, 15 * 60, '1'); // 15-minute lockout
      await redis.del(`${OTP_PREFIX}${identifier}`);
      return { success: false, reason: 'locked_out' };
    }

    return { success: false, reason: 'invalid', attemptsLeft: env.OTP_MAX_ATTEMPTS - attempts };
  }

  await redis.del(`${OTP_PREFIX}${identifier}`);
  await redis.del(attemptsKey);
  return { success: true };
};
