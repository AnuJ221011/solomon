import redis from '../../config/redis.js';
import { logger } from './logger.js';

const FX_CACHE_KEY = 'fx:rates';

/**
 * Returns all currency codes currently in the cache.
 * Falls back to a minimal static list if the cache is cold.
 */
export const getSupportedCurrencies = async () => {
  const rates = await getCachedRates();
  if (rates) return Object.keys(rates).sort();
  // Minimal fallback before first cache warm-up
  return ['USD', 'GBP', 'EUR', 'AUD', 'CAD', 'SGD', 'AED', 'INR'];
};

/**
 * Returns cached FX rates (INR base). Shape: { USD: 0.012, GBP: 0.0095, ... }
 */
export const getCachedRates = async () => {
  const raw = await redis.get(FX_CACHE_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
};

/**
 * Stores FX rates in Redis with a 6-hour TTL.
 */
export const cacheRates = async (rates) => {
  await redis.setex(FX_CACHE_KEY, 6 * 60 * 60, JSON.stringify(rates));
};

/**
 * Converts an INR amount to the target currency.
 * Returns null if rates are unavailable or currency is not supported.
 */
export const convertFromINR = async (amountInr, targetCurrency) => {
  if (targetCurrency === 'INR') return amountInr;

  const rates = await getCachedRates();
  if (!rates) {
    logger.warn(`FX rates not cached; returning null for ${targetCurrency}`);
    return null;
  }

  const rate = rates[targetCurrency];
  if (!rate) return null;
  return parseFloat((amountInr * rate).toFixed(2));
};

/**
 * Formats a monetary value with locale-aware symbol.
 */
export const formatCurrency = (amount, currency) => {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount);
};
