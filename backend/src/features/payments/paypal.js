import { env } from '../../config/env.js';
import redis from '../../config/redis.js';
import { logger } from '../../shared/utils/logger.js';

const BASE_URL = env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

const TOKEN_CACHE_KEY = 'paypal:access_token';

/** Fetches a cached or fresh PayPal access token. */
export const getAccessToken = async () => {
  const cached = await redis.get(TOKEN_CACHE_KEY);
  if (cached) return cached;

  const credentials = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal token error: ${err}`);
  }

  const data = await res.json();
  // Cache with 60-second buffer before expiry
  await redis.setex(TOKEN_CACHE_KEY, data.expires_in - 60, data.access_token);
  return data.access_token;
};

const paypalFetch = async (path, method, body) => {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    logger.error('PayPal API error', { path, status: res.status, data });
    throw new Error(data.message ?? 'PayPal API error');
  }
  return data;
};

/**
 * Creates a PayPal order for the given amount in the given currency.
 * Returns the PayPal order ID and approval URL.
 */
export const createPayPalOrder = async ({ amountValue, currency, referenceId, returnUrl, cancelUrl }) => {
  const data = await paypalFetch('/v2/checkout/orders', 'POST', {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: referenceId,
        amount: {
          currency_code: currency,
          value: amountValue.toFixed(2),
        },
      },
    ],
    application_context: {
      return_url: returnUrl,
      cancel_url: cancelUrl,
      brand_name: 'Solomon Bharat',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
    },
  });

  const approvalUrl = data.links?.find((l) => l.rel === 'approve')?.href;
  return { paypalOrderId: data.id, approvalUrl, status: data.status };
};

/**
 * Captures a previously created and approved PayPal order.
 * Returns the capture details including amount and status.
 */
export const capturePayPalOrder = async (paypalOrderId) => {
  return paypalFetch(`/v2/checkout/orders/${paypalOrderId}/capture`, 'POST');
};

/**
 * Fetches a PayPal order to verify its status and amount.
 */
export const getPayPalOrder = async (paypalOrderId) => {
  return paypalFetch(`/v2/checkout/orders/${paypalOrderId}`, 'GET');
};

/**
 * Verifies a PayPal webhook signature.
 */
export const verifyWebhookSignature = async ({ headers, body }) => {
  if (!env.PAYPAL_WEBHOOK_ID) return true; // Skip in dev when not configured

  return paypalFetch('/v1/notifications/verify-webhook-signature', 'POST', {
    auth_algo: headers['paypal-auth-algo'],
    cert_url: headers['paypal-cert-url'],
    transmission_id: headers['paypal-transmission-id'],
    transmission_sig: headers['paypal-transmission-sig'],
    transmission_time: headers['paypal-transmission-time'],
    webhook_id: env.PAYPAL_WEBHOOK_ID,
    webhook_event: body,
  });
};
