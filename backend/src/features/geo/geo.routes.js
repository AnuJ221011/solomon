import { Router } from 'express';
import { env } from '../../config/env.js';
import { getSupportedCurrencies } from '../../shared/utils/currency.js';
import { sendSuccess, sendError } from '../../shared/utils/response.js';
import { logger } from '../../shared/utils/logger.js';

const router = Router();

// Currency → country code default map
const CURRENCY_MAP = {
  US: 'USD', GB: 'GBP', AU: 'AUD', CA: 'CAD',
  SG: 'SGD', AE: 'AED', IN: 'INR',
  AT: 'EUR', BE: 'EUR', DE: 'EUR', ES: 'EUR', FR: 'EUR',
  IT: 'EUR', NL: 'EUR', PT: 'EUR', IE: 'EUR',
};

/**
 * GET /api/geo/detect
 * Returns the visitor's country code and suggested currency.
 * Reads X-Forwarded-For or req.ip; queries ipapi.co.
 */
router.get('/detect', async (req, res) => {
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress;

  // Local/private IPs — return India as default in development
  if (!ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return sendSuccess(res, { countryCode: 'IN', currency: 'INR', source: 'default' });
  }

  try {
    const url = env.IPAPI_KEY
      ? `https://ipapi.co/${ip}/json/?key=${env.IPAPI_KEY}`
      : `https://ipapi.co/${ip}/json/`;

    const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) throw new Error(`ipapi status ${response.status}`);

    const data = await response.json();
    if (data.error) throw new Error(data.reason ?? 'ipapi error');

    const countryCode = data.country_code ?? 'IN';
    const detectedCurrency = data.currency ?? 'USD';
    const supported = await getSupportedCurrencies();

    // Use detected currency if supported, else map by country, else USD
    const currency = supported.includes(detectedCurrency)
      ? detectedCurrency
      : (CURRENCY_MAP[countryCode] ?? 'USD');

    return sendSuccess(res, { countryCode, currency, source: 'ipapi' });
  } catch (err) {
    logger.warn('Geo-detect failed — returning default', { error: err.message });
    return sendSuccess(res, { countryCode: 'US', currency: 'USD', source: 'fallback' });
  }
});

export default router;
