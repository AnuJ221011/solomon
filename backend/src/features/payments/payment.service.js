import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';
import { getCachedRates } from '../../shared/utils/currency.js';
import { calculateShipping } from '../shipping/shipping.service.js';
import { createPayPalOrder, capturePayPalOrder, getPayPalOrder } from './paypal.js';
import { createOrdersFromCart, resolveUnitPriceInr } from '../orders/order.service.js';
import { env } from '../../config/env.js';

/**
 * Calculates the total payable amount for the buyer's cart.
 * Groups by brand, applies shipping, returns a breakdown and grand total.
 */
export const calculateCartTotal = async (buyerUserId, countryCode) => {
  const cart = await prisma.cart.findUnique({
    where: { userId: buyerUserId },
    include: {
      items: {
        include: {
          product: {
            include: { brandProfile: { select: { id: true } }, priceTiers: true },
          },
          variant: true,
        },
      },
    },
  });

  if (!cart || cart.items.length === 0) throw createError('Cart is empty', 400);

  const buyer = await prisma.user.findUnique({
    where: { id: buyerUserId },
    include: { buyerProfile: true },
  });

  const rates = await getCachedRates();
  const currency = buyer.buyerProfile?.preferredCurrency ?? 'USD';
  const fxRate = rates?.[currency] ?? 1;

  // Group by brand
  const byBrand = cart.items.reduce((acc, item) => {
    const brandId = item.product.brandProfileId;
    if (!acc[brandId]) acc[brandId] = { brandId, items: [] };
    acc[brandId].items.push(item);
    return acc;
  }, {});

  let grandTotalInr = 0;
  const brandBreakdowns = [];

  for (const { brandId, items } of Object.values(byBrand)) {
    const subtotalInr = items.reduce(
      (sum, item) => sum + resolveUnitPriceInr(item.product, item.variant, item.quantity) * item.quantity,
      0
    );
    const totalWeightGrams = items.reduce(
      (sum, item) => sum + item.product.weightGrams * item.quantity,
      0
    );
    const shippingResult = await calculateShipping(brandId, countryCode, totalWeightGrams, subtotalInr);
    const shippingCostInr = shippingResult.requiresQuote ? 0 : (shippingResult.shippingCostInr ?? 0);
    const brandTotal = subtotalInr + shippingCostInr;
    grandTotalInr += brandTotal;

    brandBreakdowns.push({ brandId, subtotalInr, shippingCostInr, totalInr: brandTotal });
  }

  // Apply wallet credit ceiling (cannot exceed grand total)
  const wallet = await prisma.wallet.findUnique({ where: { userId: buyerUserId } });
  const availableCreditsInr = wallet ? Number(wallet.balanceInr) : 0;

  return {
    grandTotalInr,
    grandTotalBuyerCurrency: parseFloat((grandTotalInr * fxRate).toFixed(2)),
    currency,
    fxRate,
    availableCreditsInr,
    brandBreakdowns,
  };
};

/**
 * Creates a PayPal order for the cart total.
 * The buyer approves this in the PayPal UI before we capture.
 */
export const initiatePayPalPayment = async (buyerUserId, { countryCode, walletCreditsToApplyInr = 0 }) => {
  const totals = await calculateCartTotal(buyerUserId, countryCode);

  const creditsApplied = Math.min(walletCreditsToApplyInr, totals.availableCreditsInr, totals.grandTotalInr);
  const chargeableTotalBuyerCurrency = parseFloat(
    ((totals.grandTotalInr - creditsApplied) * totals.fxRate).toFixed(2)
  );

  // PayPal requires amount > 0 even if credits cover everything
  if (chargeableTotalBuyerCurrency <= 0) {
    throw createError('Order total is fully covered by wallet credits — no PayPal payment needed', 400);
  }

  const { paypalOrderId, approvalUrl } = await createPayPalOrder({
    amountValue: chargeableTotalBuyerCurrency,
    currency: totals.currency,
    referenceId: buyerUserId,
    returnUrl: `${env.CLIENT_URL}/checkout/success`,
    cancelUrl: `${env.CLIENT_URL}/checkout/cancel`,
  });

  return { paypalOrderId, approvalUrl, chargeableTotalBuyerCurrency, currency: totals.currency, creditsApplied };
};

/**
 * Captures the PayPal payment and creates platform orders from the cart.
 * This is the final step — after this the cart is cleared.
 *
 * Idempotent: if this is called again for a paypalOrderId that already has
 * orders (buyer double-click, client retry, webhook redelivery), those orders
 * are returned as-is rather than re-captured or re-created. If a previous
 * attempt captured the payment but failed before orders were created, this
 * detects the existing capture and retries only order creation — instead of
 * trying to re-capture an already-captured PayPal order, which PayPal rejects.
 */
export const captureAndFulfil = async (buyerUserId, { paypalOrderId, shippingAddress, walletCreditsToApplyInr }) => {
  const existingOrders = await prisma.order.findMany({ where: { paypalOrderId } });
  if (existingOrders.length > 0) {
    return { orders: existingOrders, paypalCaptureId: existingOrders[0].paypalCaptureId };
  }

  // Verify the PayPal order exists and is approved (or already captured by a
  // previous attempt that failed further down this function)
  const paypalOrder = await getPayPalOrder(paypalOrderId);
  if (!['APPROVED', 'COMPLETED'].includes(paypalOrder.status)) {
    throw createError(`PayPal order not approved (status: ${paypalOrder.status})`, 400);
  }

  let captureId = paypalOrder.status === 'COMPLETED'
    ? paypalOrder.purchase_units?.[0]?.payments?.captures?.[0]?.id
    : undefined;

  if (!captureId) {
    const capture = await capturePayPalOrder(paypalOrderId);
    captureId = capture.purchase_units?.[0]?.payments?.captures?.[0]?.id;
  }

  if (!captureId) throw createError('PayPal capture did not return a capture ID', 500);

  // Create platform orders from cart (commission resolution, payout records,
  // etc.), stamped CONFIRMED + capture ID in the same transaction as creation.
  const orders = await createOrdersFromCart(buyerUserId, {
    shippingAddress,
    paypalOrderId,
    paypalCaptureId: captureId,
    walletCreditsToApplyInr: walletCreditsToApplyInr ?? 0,
  });

  return { orders, paypalCaptureId: captureId };
};
