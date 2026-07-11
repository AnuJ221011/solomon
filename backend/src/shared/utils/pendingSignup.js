import redis from '../../config/redis.js';

const PREFIX = 'pending_signup:';
// Longer than the OTP's own expiry so a resend can issue a fresh code
// without losing the signup form data already collected.
const TTL_SECONDS = 30 * 60;

export const storePendingSignup = async (email, data) => {
  await redis.setex(`${PREFIX}${email}`, TTL_SECONDS, JSON.stringify(data));
};

export const getPendingSignup = async (email) => {
  const raw = await redis.get(`${PREFIX}${email}`);
  return raw ? JSON.parse(raw) : null;
};

export const deletePendingSignup = async (email) => {
  await redis.del(`${PREFIX}${email}`);
};
