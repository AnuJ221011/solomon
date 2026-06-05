import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';
import { SHIPPING_ZONES, getZoneForCountry } from '../../shared/constants/shipping.js';
import { getShiprocketRate } from './shiprocket.js';

export const upsertShippingRate = async (userId, data) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);

  return prisma.shippingRate.upsert({
    where: { brandProfileId_zone: { brandProfileId: brand.id, zone: data.zone } },
    create: { ...data, brandProfileId: brand.id },
    update: data,
  });
};

export const getShippingRates = async (userId) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);
  return prisma.shippingRate.findMany({ where: { brandProfileId: brand.id } });
};

/**
 * Calculates the shipping cost for an order.
 * Tries Shiprocket for real-time rates first; falls back to the brand's custom rate table.
 */
export const calculateShipping = async (brandProfileId, countryCode, weightGrams, subtotalInr, deliveryPincode) => {
  const zone = getZoneForCountry(countryCode);
  const zoneConfig = SHIPPING_ZONES[zone];

  if (zoneConfig.quoteOnly) {
    return { zone, requiresQuote: true, estimatedDelivery: zoneConfig.estimatedDelivery, source: 'quote' };
  }

  // 1 — Try Shiprocket real-time rate
  const brand = await prisma.brandProfile.findUnique({
    where: { id: brandProfileId },
    select: { pickupPincode: true },
  });

  const weightKg = weightGrams / 1000;
  const shiprocketRate = await getShiprocketRate({
    pickupPincode: brand?.pickupPincode,
    deliveryPincode,
    deliveryCountry: countryCode,
    weightKg: Math.max(weightKg, 0.1),
    declaredValueInr: subtotalInr,
  });

  if (shiprocketRate !== null) {
    return {
      zone,
      shippingCostInr: shiprocketRate,
      isFree: false,
      estimatedDelivery: zoneConfig.estimatedDelivery,
      source: 'shiprocket',
    };
  }

  // 2 — Fall back to brand's custom rate table
  const rate = await prisma.shippingRate.findUnique({
    where: { brandProfileId_zone: { brandProfileId, zone } },
  });

  if (!rate) {
    return { zone, requiresQuote: true, estimatedDelivery: zoneConfig.estimatedDelivery, source: 'no_rate' };
  }

  // Check free shipping threshold
  if (rate.freeShippingAboveInr && subtotalInr >= Number(rate.freeShippingAboveInr)) {
    return { zone, shippingCostInr: 0, isFree: true, estimatedDelivery: zoneConfig.estimatedDelivery, source: 'custom_free' };
  }

  let shippingCostInr = 0;
  if (rate.rateType === 'FLAT') {
    shippingCostInr = Number(rate.flatRateInr);
  } else {
    shippingCostInr = parseFloat((weightKg * Number(rate.perKgRateInr)).toFixed(2));
  }

  return { zone, shippingCostInr, isFree: false, estimatedDelivery: zoneConfig.estimatedDelivery, source: 'custom' };
};
