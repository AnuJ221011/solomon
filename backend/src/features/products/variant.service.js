import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Generates a human-readable label from variant attributes, e.g. "Color: Red / Size: L" */
const buildVariantLabel = (attributes) =>
  attributes.map((a) => `${a.name}: ${a.value}`).join(' / ');

/** Verifies the product belongs to the requesting brand user */
const getOwnedProduct = async (userId, productId) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);

  const product = await prisma.product.findFirst({
    where: { id: productId, brandProfileId: brand.id },
  });
  if (!product) throw createError('Product not found', 404);
  return { product, brand };
};

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Returns all variants for a product with their attributes.
 * Used by the product detail page and brand dashboard.
 */
export const getVariantsByProduct = async (productId) => {
  return prisma.productVariant.findMany({
    where: { productId },
    include: { attributes: { orderBy: { name: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  });
};

/** Returns a single variant with attributes (public — no auth needed) */
export const getVariantById = async (variantId) => {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { attributes: true },
  });
  if (!variant) throw createError('Variant not found', 404);
  return variant;
};

// ── Create ────────────────────────────────────────────────────────────────────

/**
 * Creates a single variant with its attributes.
 * attributes: [{ name: "Color", value: "Red" }, { name: "Size", value: "L" }]
 */
export const createVariant = async (userId, productId, { sku, priceInr, stock, imageUrl, status, attributes }) => {
  await getOwnedProduct(userId, productId);

  // Check SKU uniqueness
  const existing = await prisma.productVariant.findUnique({ where: { sku } });
  if (existing) throw createError(`SKU "${sku}" is already in use`, 409);

  return prisma.productVariant.create({
    data: {
      productId,
      sku,
      priceInr,
      stock: stock ?? 0,
      imageUrl: imageUrl ?? null,
      status: status ?? 'ACTIVE',
      attributes: {
        create: (attributes ?? []).map((a) => ({ name: a.name, value: a.value })),
      },
    },
    include: { attributes: true },
  });
};

/**
 * Bulk-creates multiple variants in a single transaction.
 * Used by the "Generate combinations" feature on the product form.
 *
 * variants: [
 *   { sku, priceInr, stock, imageUrl, status, attributes: [{name,value}] },
 *   ...
 * ]
 */
export const createVariantsBulk = async (userId, productId, variants) => {
  await getOwnedProduct(userId, productId);

  // Validate all SKUs are unique (against each other + existing DB rows)
  const skus = variants.map((v) => v.sku);
  const uniqueSkus = new Set(skus);
  if (uniqueSkus.size !== skus.length) {
    throw createError('Duplicate SKUs in the submitted variants', 422);
  }

  const existingSkus = await prisma.productVariant.findMany({
    where: { sku: { in: skus } },
    select: { sku: true },
  });
  if (existingSkus.length > 0) {
    throw createError(`SKUs already in use: ${existingSkus.map((s) => s.sku).join(', ')}`, 409);
  }

  return prisma.$transaction(
    variants.map((v) =>
      prisma.productVariant.create({
        data: {
          productId,
          sku: v.sku,
          priceInr: v.priceInr,
          stock: v.stock ?? 0,
          imageUrl: v.imageUrl ?? null,
          status: v.status ?? 'ACTIVE',
          attributes: { create: (v.attributes ?? []).map((a) => ({ name: a.name, value: a.value })) },
        },
        include: { attributes: true },
      })
    )
  );
};

// ── Update ────────────────────────────────────────────────────────────────────

export const updateVariant = async (userId, productId, variantId, updates) => {
  const { product } = await getOwnedProduct(userId, productId);

  const variant = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
  });
  if (!variant) throw createError('Variant not found', 404);

  // If SKU is being changed, check it's not taken
  if (updates.sku && updates.sku !== variant.sku) {
    const conflict = await prisma.productVariant.findUnique({ where: { sku: updates.sku } });
    if (conflict) throw createError(`SKU "${updates.sku}" is already in use`, 409);
  }

  const { attributes, ...scalarUpdates } = updates;

  return prisma.$transaction(async (tx) => {
    // Update scalar fields
    const updated = await tx.productVariant.update({
      where: { id: variantId },
      data: scalarUpdates,
    });

    // If attributes are provided, replace them entirely
    if (attributes) {
      await tx.variantAttribute.deleteMany({ where: { variantId } });
      await tx.variantAttribute.createMany({
        data: attributes.map((a) => ({ variantId, name: a.name, value: a.value })),
      });
    }

    return tx.productVariant.findUnique({
      where: { id: variantId },
      include: { attributes: true },
    });
  });
};

// ── Stock management ──────────────────────────────────────────────────────────

export const updateStock = async (userId, productId, variantId, { stock, delta }) => {
  await getOwnedProduct(userId, productId);

  const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId } });
  if (!variant) throw createError('Variant not found', 404);

  if (stock !== undefined) {
    // Absolute set
    return prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: Math.max(0, stock) },
      include: { attributes: true },
    });
  }

  if (delta !== undefined) {
    // Relative adjustment (e.g. -1 on order, +10 on restock)
    const newStock = Math.max(0, variant.stock + delta);
    return prisma.productVariant.update({
      where: { id: variantId },
      data: {
        stock: newStock,
        status: newStock === 0 ? 'OUT_OF_STOCK' : 'ACTIVE',
      },
      include: { attributes: true },
    });
  }

  throw createError('Provide either stock (absolute) or delta (relative)', 400);
};

// ── Delete ────────────────────────────────────────────────────────────────────

export const deleteVariant = async (userId, productId, variantId) => {
  await getOwnedProduct(userId, productId);

  const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId } });
  if (!variant) throw createError('Variant not found', 404);

  // Guard: prevent deletion if referenced in a completed/dispatched order
  const completedOrderItem = await prisma.orderItem.findFirst({
    where: {
      variantId,
      order: { status: { in: ['CONFIRMED', 'PROCESSING', 'DISPATCHED', 'DELIVERED'] } },
    },
  });
  if (completedOrderItem) {
    throw createError(
      'Cannot delete a variant that is referenced in a confirmed or dispatched order. Set it to INACTIVE instead.',
      409
    );
  }

  await prisma.productVariant.delete({ where: { id: variantId } });
};

// ── Internal helpers used by order/cart services ──────────────────────────────

/**
 * Decrements stock when an order is placed.
 * Called inside the order creation transaction.
 */
export const decrementStockOnOrder = async (tx, variantId, quantity) => {
  const variant = await tx.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) return;

  const newStock = Math.max(0, variant.stock - quantity);
  await tx.productVariant.update({
    where: { id: variantId },
    data: {
      stock: newStock,
      status: newStock === 0 ? 'OUT_OF_STOCK' : variant.status,
    },
  });
};
