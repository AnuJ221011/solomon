import { env } from '../../config/env.js';
import redis from '../../config/redis.js';
import { logger } from '../../shared/utils/logger.js';

const BASE_URL = 'https://apiv2.shiprocket.in/v1/external';
const TOKEN_KEY = 'shiprocket:token';

const isConfigured = () => Boolean(env.SHIPROCKET_EMAIL && env.SHIPROCKET_PASSWORD);

const getToken = async () => {
  if (!isConfigured()) return null;

  const cached = await redis.get(TOKEN_KEY);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: env.SHIPROCKET_EMAIL, password: env.SHIPROCKET_PASSWORD }),
  });

  if (!res.ok) {
    logger.warn('Shiprocket login failed', { status: res.status });
    return null;
  }

  const data = await res.json();
  if (!data.token) return null;

  // Token is valid for 24 hours — cache for 23
  await redis.setex(TOKEN_KEY, 23 * 60 * 60, data.token);
  return data.token;
};

/**
 * Fetches real-time shipping rates from Shiprocket.
 * Returns null if Shiprocket is not configured or request fails.
 *
 * @param {object} params
 * @param {string} params.pickupPincode   - Brand's pickup pincode
 * @param {string} params.deliveryPincode - Buyer's delivery pincode (domestic only)
 * @param {string} params.deliveryCountry - ISO alpha-2 country code
 * @param {number} params.weightKg        - Total shipment weight in kg
 * @param {number} params.declaredValueInr - Order subtotal in INR
 * @returns {Promise<number|null>} Cheapest rate in INR, or null if unavailable
 */
export const getShiprocketRate = async ({
  pickupPincode,
  deliveryPincode,
  deliveryCountry,
  weightKg,
  declaredValueInr,
}) => {
  if (!isConfigured()) return null;

  const token = await getToken();
  if (!token) return null;

  try {
    const isDomestic = deliveryCountry === 'IN';
    const endpoint = isDomestic
      ? `${BASE_URL}/courier/serviceability/`
      : `${BASE_URL}/courier/international/serviceability`;

    const params = new URLSearchParams({
      pickup_postcode: pickupPincode ?? '110001', // Default Delhi if not set
      weight: weightKg.toFixed(2),
      declared_value: declaredValueInr.toFixed(0),
      cod: '0',
    });

    if (isDomestic) {
      params.set('delivery_postcode', deliveryPincode ?? '400001');
    } else {
      params.set('delivery_country', deliveryCountry);
    }

    const res = await fetch(`${endpoint}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;

    const data = await res.json();

    // Find cheapest available courier
    const couriers = isDomestic
      ? data?.data?.available_courier_companies
      : data?.data?.international_couriers;

    if (!couriers?.length) return null;

    const cheapest = couriers.reduce((min, c) => {
      const rate = Number(c.rate ?? c.freight_charge ?? Infinity);
      return rate < min ? rate : min;
    }, Infinity);

    return cheapest === Infinity ? null : cheapest;
  } catch (err) {
    logger.warn('Shiprocket rate fetch failed — falling back to custom rates', { error: err.message });
    return null;
  }
};
