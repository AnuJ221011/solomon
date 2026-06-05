import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';
import { logger } from '../../shared/utils/logger.js';

const shopifyFetch = async (shopDomain, accessToken, path, method = 'GET', body) => {
  const url = `https://${shopDomain}/admin/api/2024-01${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Shopify API error ${res.status}: ${err}`);
  }
  return res.json();
};

// ── Store connection ──────────────────────────────────────────────────────

export const connectStore = async (userId, { shopDomain, accessToken }) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);

  // Verify credentials by fetching shop info
  const shopInfo = await shopifyFetch(shopDomain, accessToken, '/shop.json');
  if (!shopInfo.shop) throw createError('Invalid Shopify credentials', 400);

  return prisma.shopifyStore.upsert({
    where: { brandProfileId: brand.id },
    create: { brandProfileId: brand.id, shopDomain, accessToken },
    update: { shopDomain, accessToken, isActive: true },
  });
};

export const disconnectStore = async (userId) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);
  await prisma.shopifyStore.update({
    where: { brandProfileId: brand.id },
    data: { isActive: false },
  });
};

export const getStore = async (userId) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) return null;
  const store = await prisma.shopifyStore.findUnique({ where: { brandProfileId: brand.id } });
  if (!store) return null;
  // Never return the access token to the client
  const { accessToken: _token, ...safeStore } = store;
  return safeStore;
};

// ── Product sync: Shopify → Solomon Bharat ────────────────────────────────

export const importProductsFromShopify = async (userId) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);
  if (brand.status !== 'APPROVED') throw createError('Brand must be approved', 403);

  const store = await prisma.shopifyStore.findUnique({ where: { brandProfileId: brand.id } });
  if (!store || !store.isActive) throw createError('No active Shopify store connected', 400);

  const data = await shopifyFetch(store.shopDomain, store.accessToken, '/products.json?limit=250');
  const shopifyProducts = data.products ?? [];

  let imported = 0;
  let skipped = 0;

  for (const sp of shopifyProducts) {
    const existing = await prisma.product.findFirst({
      where: { brandProfileId: brand.id, name: sp.title },
    });
    if (existing) { skipped++; continue; }

    const slug = `${sp.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sp.id}`;
    const price = parseFloat(sp.variants?.[0]?.price ?? '0') * 84; // rough USD→INR estimate

    await prisma.product.create({
      data: {
        brandProfileId: brand.id,
        name: sp.title.slice(0, 80),
        slug,
        shortDescription: sp.body_html?.replace(/<[^>]*>/g, '').slice(0, 160) ?? sp.title,
        fullDescription: sp.body_html,
        wholesalePriceInr: price,
        moq: 1,
        leadTime: 'ONE_TO_TWO_WEEKS',
        weightGrams: Math.round((sp.variants?.[0]?.weight ?? 0.5) * 1000),
        countryOfOrigin: 'IN',
        categories: sp.product_type ? [sp.product_type] : [],
        tags: (sp.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10),
        enabledZones: ['EUROPE', 'NORTH_AMERICA'],
        availability: sp.status === 'active' ? 'ACTIVE' : 'INACTIVE',
      },
    });
    imported++;
  }

  await prisma.shopifyStore.update({ where: { id: store.id }, data: { lastSyncAt: new Date() } });
  return { imported, skipped, total: shopifyProducts.length };
};

// ── Order sync: Solomon Bharat → Shopify ─────────────────────────────────

export const pushOrderToShopify = async (order) => {
  const brand = await prisma.brandProfile.findUnique({
    where: { id: order.brandProfileId },
    include: { shopifyStore: true },
  });

  if (!brand.shopifyStore?.isActive) return; // No Shopify store connected

  const { shopDomain, accessToken } = brand.shopifyStore;
  const buyer = await prisma.user.findUnique({
    where: { id: order.buyerUserId },
    include: { buyerProfile: true },
  });

  const lineItems = await Promise.all(
    (order.items ?? []).map(async (item) => {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      return { title: product.name, quantity: item.quantity, price: String(item.unitPriceInr) };
    })
  );

  await shopifyFetch(shopDomain, accessToken, '/orders.json', 'POST', {
    order: {
      email: buyer.email,
      line_items: lineItems,
      note: `Solomon Bharat order: ${order.id}`,
      tags: 'solomon-bharat',
    },
  }).catch((err) => logger.warn('Shopify order push failed', { orderId: order.id, error: err.message }));
};

// ── Webhook handlers ──────────────────────────────────────────────────────

export const handleProductUpdate = async (shopDomain, payload) => {
  const store = await prisma.shopifyStore.findUnique({ where: { shopDomain } });
  if (!store) return;

  const sp = payload;
  const slug = `${sp.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${sp.id}`;

  await prisma.product.updateMany({
    where: { brandProfileId: store.brandProfileId, name: sp.title },
    data: {
      availability: sp.status === 'active' ? 'ACTIVE' : 'INACTIVE',
      shortDescription: sp.body_html?.replace(/<[^>]*>/g, '').slice(0, 160) ?? sp.title,
    },
  });
  logger.info('Shopify product update synced', { shopDomain, title: sp.title });
};

export const handleInventoryUpdate = async (shopDomain, payload) => {
  logger.info('Shopify inventory webhook received', { shopDomain, inventoryItemId: payload.inventory_item_id });
  // Map Shopify inventory item → Solomon Bharat product variant and update availability
  // Full implementation requires storing Shopify inventory_item_id on ProductVariant
};
