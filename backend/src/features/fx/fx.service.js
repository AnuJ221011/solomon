import { cacheRates, getCachedRates } from '../../shared/utils/currency.js';
import prisma from '../../config/db.js';
import { logger } from '../../shared/utils/logger.js';

const FRANKFURTER_URL = 'https://api.frankfurter.app/latest';

/**
 * Currencies not in Frankfurter (ECB) but derivable from the USD rate.
 * Value = units of that currency per 1 USD (official/fixed peg or close approximation).
 */
const USD_DERIVED = {
  AED: 3.6725,  // UAE dirham — hard peg
  SAR: 3.7500,  // Saudi riyal — hard peg
  QAR: 3.6400,  // Qatari riyal — hard peg
  BHD: 0.3760,  // Bahraini dinar — hard peg
  OMR: 0.3850,  // Omani rial — hard peg
  JOD: 0.7090,  // Jordanian dinar — hard peg
  KWD: 0.3060,  // Kuwaiti dinar — managed float (close to peg)
  EGP: 48.00,   // Egyptian pound — approximate
  PKR: 278.00,  // Pakistani rupee — approximate
  BDT: 110.00,  // Bangladeshi taka — approximate
  LKR: 320.00,  // Sri Lankan rupee — approximate
  NPR: 133.00,  // Nepalese rupee — approximate (pegged to INR × 1.6)
};

/**
 * Fetches all available rates from Frankfurter (INR base) and appends
 * USD-derived currencies. Caches in Redis and snapshots to DB.
 */
export const refreshFxRates = async () => {
  // Omit `to=` to get ALL currencies Frankfurter supports (~33)
  const url = `${FRANKFURTER_URL}?base=INR`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Frankfurter API error: ${resp.status}`);

  const json = await resp.json();
  if (!json.rates) throw new Error('Unexpected Frankfurter response format');

  const rates = { ...json.rates, INR: 1 };

  // Append USD-derived currencies using the fetched USD rate
  const usdPerInr = rates.USD;
  if (usdPerInr) {
    for (const [currency, perUsd] of Object.entries(USD_DERIVED)) {
      if (!rates[currency]) {
        rates[currency] = parseFloat((usdPerInr * perUsd).toFixed(8));
      }
    }
  }

  // Normalise all values to 8 dp
  for (const key of Object.keys(rates)) {
    rates[key] = parseFloat(Number(rates[key]).toFixed(8));
  }

  await cacheRates(rates);
  await prisma.fxRateSnapshot.create({ data: { rates } });

  logger.info('FX rates refreshed via Frankfurter', {
    date: json.date,
    totalCurrencies: Object.keys(rates).length,
  });
  return rates;
};

export const getCurrentRates = async () => {
  const cached = await getCachedRates();
  if (cached) return cached;
  return refreshFxRates();
};
