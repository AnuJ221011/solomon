import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';

const VALID_LEAD_TIMES = ['ONE_TO_THREE_DAYS', 'ONE_TO_TWO_WEEKS', 'TWO_TO_FOUR_WEEKS'];
const VALID_ZONES = ['DOMESTIC', 'SOUTH_ASIA', 'SOUTHEAST_ASIA', 'MIDDLE_EAST', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'REST_OF_WORLD'];

export const parseCsv = (csvText) => {
  const lines = csvText.trim().split('\n').map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) throw createError('CSV must have a header row and at least one data row', 400);

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));

  return lines.slice(1).map((line, idx) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { values.push(current.trim()); current = ''; continue; }
      current += ch;
    }
    values.push(current.trim());

    if (values.length !== headers.length) {
      throw createError(`Row ${idx + 2}: column count mismatch (expected ${headers.length}, got ${values.length})`, 422);
    }

    return Object.fromEntries(headers.map((h, i) => [h, values[i]]));
  });
};

const validateProductRow = (row, rowIndex) => {
  const errors = [];
  const label = `Row ${rowIndex}`;

  if (!row.name || row.name.length > 80) errors.push(`${label}: name is required and must be ≤ 80 chars`);
  if (!row.short_description || row.short_description.length > 160) errors.push(`${label}: short_description required, ≤ 160 chars`);

  const price = parseFloat(row.wholesale_price_inr);
  if (isNaN(price) || price <= 0) errors.push(`${label}: wholesale_price_inr must be a positive number`);

  const moq = parseInt(row.moq, 10);
  if (isNaN(moq) || moq < 1) errors.push(`${label}: moq must be a positive integer`);

  const weight = parseInt(row.weight_grams, 10);
  if (isNaN(weight) || weight < 1) errors.push(`${label}: weight_grams must be a positive integer`);

  const leadTime = row.lead_time?.toUpperCase().replace(/[\s-]+/g, '_');
  if (!VALID_LEAD_TIMES.includes(leadTime)) {
    errors.push(`${label}: lead_time must be one of: one_to_three_days, one_to_two_weeks, two_to_four_weeks`);
  }

  const zones = (row.shipping_zones ?? '').split('|').map((z) => z.trim().toUpperCase()).filter(Boolean);
  const invalidZones = zones.filter((z) => !VALID_ZONES.includes(z));
  if (invalidZones.length) errors.push(`${label}: invalid shipping zones: ${invalidZones.join(', ')}`);

  if (errors.length) return { data: null, errors };

  return {
    errors: [],
    data: {
      name: row.name,
      shortDescription: row.short_description,
      fullDescription: row.full_description || null,
      wholesalePriceInr: price,
      moq,
      leadTime,
      weightGrams: weight,
      hsTariffCode: row.hs_tariff_code || null,
      countryOfOrigin: row.country_of_origin || 'IN',
      categories: (row.categories ?? '').split('|').map((c) => c.trim()).filter(Boolean),
      tags: (row.tags ?? '').split('|').map((t) => t.trim()).filter(Boolean).slice(0, 10),
      enabledZones: zones,
      availability: 'ACTIVE',
    },
  };
};

// Parses variant columns from a row. Returns null if no variant_sku present.
const parseVariantRow = (row, rowIndex, basePrice) => {
  const sku = row.variant_sku?.trim();
  if (!sku) return null;

  const errors = [];
  const label = `Row ${rowIndex} (variant)`;

  const priceRaw = row.variant_price_inr?.trim();
  const price = priceRaw ? parseFloat(priceRaw) : basePrice;
  if (isNaN(price) || price <= 0) errors.push(`${label}: variant_price_inr must be a positive number`);

  const stock = parseInt(row.variant_stock ?? '0', 10);
  if (isNaN(stock) || stock < 0) errors.push(`${label}: variant_stock must be a non-negative integer`);

  // "Size:S|Color:Red" → [{ name: 'Size', value: 'S' }, { name: 'Color', value: 'Red' }]
  const attributes = (row.variant_attributes ?? '')
    .split('|')
    .map((a) => {
      const colon = a.indexOf(':');
      if (colon < 1) return null;
      return { name: a.slice(0, colon).trim(), value: a.slice(colon + 1).trim() };
    })
    .filter(Boolean);

  if (errors.length) return { data: null, errors };
  return { errors: [], data: { sku, priceInr: price, stock, attributes } };
};

export const importProductsFromCsv = async (userId, csvText) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);
  if (brand.status !== 'APPROVED') throw createError('Brand must be approved to import products', 403);

  const rows = parseCsv(csvText);
  const results = { created: 0, skipped: 0, errors: [] };

  // Group consecutive rows by product name so multi-variant products stay together.
  // Key is lowercased name; value is array of row objects.
  const groups = new Map();
  for (const row of rows) {
    const key = (row.name ?? '').trim().toLowerCase();
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  let globalRowIdx = 2; // tracks CSV row number for error messages
  for (const [, groupRows] of groups) {
    const firstRow = groupRows[0];
    const rowIndex = globalRowIdx;
    globalRowIdx += groupRows.length;

    // Validate product-level fields from the first row of the group
    const { data: productData, errors: productErrors } = validateProductRow(firstRow, rowIndex);
    if (productErrors.length) {
      results.errors.push(...productErrors);
      results.skipped++;
      continue;
    }

    // Skip if a product with this name already exists for this brand
    const existing = await prisma.product.findFirst({
      where: { brandProfileId: brand.id, name: productData.name },
    });
    if (existing) {
      results.skipped++;
      continue;
    }

    // Validate variant rows (all rows that have a variant_sku)
    const variantPayloads = [];
    let hasVariantError = false;

    for (let i = 0; i < groupRows.length; i++) {
      const result = parseVariantRow(groupRows[i], rowIndex + i, productData.wholesalePriceInr);
      if (!result) continue; // no variant_sku on this row — skip silently
      if (result.errors.length) {
        results.errors.push(...result.errors);
        hasVariantError = true;
      } else {
        variantPayloads.push(result.data);
      }
    }

    if (hasVariantError) {
      results.skipped++;
      continue;
    }

    // Create product + variants in a single transaction
    const slug = `${productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
    await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: { ...productData, slug, brandProfileId: brand.id },
      });

      for (const v of variantPayloads) {
        const variant = await tx.productVariant.create({
          data: { productId: product.id, sku: v.sku, priceInr: v.priceInr, stock: v.stock, status: 'ACTIVE' },
        });
        if (v.attributes.length) {
          await tx.variantAttribute.createMany({
            data: v.attributes.map((a) => ({ variantId: variant.id, name: a.name, value: a.value })),
          });
        }
      }
    });

    results.created++;
  }

  return results;
};

/**
 * Import pre-parsed products from a Shopify CSV (mapped on the frontend).
 * Accepts a JSON array of product objects — no CSV parsing needed server-side.
 */
export const importProductsFromJson = async (userId, products) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);
  if (brand.status !== 'APPROVED') throw createError('Brand must be approved to import products', 403);

  if (!Array.isArray(products) || products.length === 0) {
    throw createError('products array is required and must not be empty', 400);
  }

  const results = { created: 0, skipped: 0, errors: [] };

  for (const p of products) {
    try {
      if (!p.name?.trim()) {
        results.errors.push('Skipping a product with no name');
        results.skipped++;
        continue;
      }

      const name = p.name.trim().slice(0, 80);
      const shortDescription =
        (p.shortDescription ?? '').trim().slice(0, 160) || name.slice(0, 160);
      const wholesalePriceInr = Math.max(0.01, Number(p.wholesalePriceInr) || 0.01);
      const moq = Math.max(1, parseInt(p.moq, 10) || 1);
      const weightGrams = Math.max(1, parseInt(p.weightGrams, 10) || 100);
      const leadTime = VALID_LEAD_TIMES.includes(p.leadTime) ? p.leadTime : 'ONE_TO_TWO_WEEKS';
      const enabledZones =
        (p.enabledZones ?? []).filter((z) => VALID_ZONES.includes(z));
      if (enabledZones.length === 0) enabledZones.push('DOMESTIC');
      const categories = (p.categories ?? []).slice(0, 2).filter(Boolean);
      const tags = (p.tags ?? []).slice(0, 10).filter(Boolean);
      const availability =
        ['ACTIVE', 'INACTIVE', 'COMING_SOON'].includes(p.availability)
          ? p.availability
          : 'ACTIVE';

      const existing = await prisma.product.findFirst({
        where: { brandProfileId: brand.id, name },
      });
      if (existing) {
        results.skipped++;
        continue;
      }

      // Ensure slug is unique by appending a timestamp
      const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const slug = `${base}-${Date.now()}`;

      await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            name,
            slug,
            shortDescription,
            fullDescription: p.fullDescription || null,
            wholesalePriceInr,
            moq,
            leadTime,
            weightGrams,
            categories,
            tags,
            enabledZones,
            availability,
            brandProfileId: brand.id,
          },
        });

        const variants = (p.variants ?? []).filter((v) => v.sku?.trim());
        for (const v of variants) {
          const variant = await tx.productVariant.create({
            data: {
              productId: product.id,
              sku: v.sku.trim(),
              priceInr: Math.max(0.01, Number(v.priceInr) || wholesalePriceInr),
              stock: Math.max(0, parseInt(v.stock, 10) || 0),
              status: 'ACTIVE',
            },
          });

          if (v.attributes?.length) {
            await tx.variantAttribute.createMany({
              data: v.attributes.map((a) => ({
                variantId: variant.id,
                name: String(a.name),
                value: String(a.value),
              })),
            });
          }
        }
      });

      results.created++;
    } catch (err) {
      results.errors.push(`"${p.name}": ${err.message}`);
      results.skipped++;
    }
  }

  return results;
};
