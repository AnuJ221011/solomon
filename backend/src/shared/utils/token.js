import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../../config/env.js';
import redis from '../../config/redis.js';

const REFRESH_TOKEN_PREFIX = 'refresh:';
const BLOCKLIST_PREFIX = 'blocklist:';

export const generateAccessToken = (userId, role) =>
  jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });

export const generateRefreshToken = async (userId) => {
  const token = uuidv4();
  const ttlSeconds = 30 * 24 * 60 * 60; // 30 days
  await redis.setex(`${REFRESH_TOKEN_PREFIX}${token}`, ttlSeconds, userId);
  return token;
};

export const verifyRefreshToken = async (token) => {
  const userId = await redis.get(`${REFRESH_TOKEN_PREFIX}${token}`);
  return userId ?? null;
};

export const rotateRefreshToken = async (oldToken, userId) => {
  await redis.del(`${REFRESH_TOKEN_PREFIX}${oldToken}`);
  return generateRefreshToken(userId);
};

export const invalidateRefreshToken = async (token) => {
  await redis.del(`${REFRESH_TOKEN_PREFIX}${token}`);
};

/** Add an access token JTI to the blocklist (used on logout). */
export const blockAccessToken = async (jti, expiresInSeconds) => {
  await redis.setex(`${BLOCKLIST_PREFIX}${jti}`, expiresInSeconds, '1');
};

export const isAccessTokenBlocked = async (jti) => {
  const result = await redis.get(`${BLOCKLIST_PREFIX}${jti}`);
  return result === '1';
};
