import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';

const VALID_LEAD_TIMES = ['ONE_TO_THREE_DAYS', 'ONE_TO_TWO_WEEKS', 'TWO_TO_FOUR_WEEKS'];
const VALID_ZONES = ['DOMESTIC', 'SOUTH_ASIA', 'SOUTHEAST_ASIA', 'MIDDLE_EAST', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'REST_OF_WORLD'];

const toSlug = (name) =>
  name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ─── Gemini-powered category resolver ────────────────────────────────────────
//
// Given a list of unmatched WooCommerce/Shopify category names, fetches the
// existing platform category tree, asks Gemini where each one belongs (L1/L2/L3),
// then creates missing nodes top-down with dedup checks.
// Returns: { "Crochet purse": "Handbags", "Pot & Flower": "Plants & Flowers", ... }

async function resolveAndCreateCategories(unmatchedNames) {
  const filtered = (unmatchedNames ?? []).filter(
    (n) => n && n.toLowerCase().trim() !== 'uncategorized',
  );
  if (filtered.length === 0) return {};

  // 1. Fetch existing tree
  const existingCats = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ level: 'asc' }, { sortOrder: 'asc' }],
    select: { id: true, name: true, slug: true, level: true, parentId: true },
  });

  // 2. Dedup helpers — defined early so fallback can use them too
  const existingByName = new Map(existingCats.map((c) => [c.name.toLowerCase().trim(), c]));
  const createdThisRun = new Map();

  const findOrCreate = async (name, level, parentId) => {
    const key = name.toLowerCase().trim();
    if (existingByName.has(key)) return existingByName.get(key);
    const runKey = `${level}:${key}`;
    if (createdThisRun.has(runKey)) return createdThisRun.get(runKey);

    const slug = toSlug(name);
    const dbExisting = await prisma.category.findFirst({ where: { OR: [{ name }, { slug }] } });
    if (dbExisting) { existingByName.set(key, dbExisting); return dbExisting; }

    const sortOrder = (await prisma.category.count()) + 1;
    const created = await prisma.category.create({
      data: { name, slug, parentId: parentId ?? null, level, sortOrder, isActive: true },
    });
    existingByName.set(key, created);
    createdThisRun.set(runKey, created);
    console.log(`[import] Created category L${level}: "${name}"`);
    return created;
  };

  // 3. Try Gemini for intelligent L1/L2/L3 placement
  let placements = [];

  if (process.env.GEMINI_API_KEY) {
    const l1s = existingCats.filter((c) => c.level === 1);
    const l2s = existingCats.filter((c) => c.level === 2);
    const l3s = existingCats.filter((c) => c.level === 3);
    const treeLines = l1s.map((l1) => {
      const children = l2s.filter((l2) => l2.parentId === l1.id).map((l2) => {
        const gc = l3s.filter((l3) => l3.parentId === l2.id).map((l3) => l3.name);
        return gc.length ? `    ${l2.name}: [${gc.join(', ')}]` : `    ${l2.name}`;
      });
      return children.length ? `  ${l1.name}:\n${children.join('\n')}` : `  ${l1.name}`;
    });
    const treeText = treeLines.length ? treeLines.join('\n') : '(empty)';

    const prompt = `You are a product category classifier for a B2B wholesale marketplace.

Existing category tree (L1 → L2 → L3):
${treeText}

For each product category name below, decide where it fits in the 3-level hierarchy.
Rules:
- L1 = broad (e.g. "Fashion", "Home & Decor", "Accessories")
- L2 = medium (e.g. "Bags & Accessories", "Keychains")
- L3 = specific (e.g. "Clutch Bags", "Crochet Purse") — use only when needed
- Prefer reusing existing nodes over creating new ones
- Never create near-duplicate nodes (e.g. "Bags" vs "Bag" — pick one)
- You MUST return ONLY a JSON array, no explanation, no markdown

Category names to classify:
${filtered.map((n, i) => `${i + 1}. ${n}`).join('\n')}

Return format — JSON array only:
[{ "source": "...", "l1": "...", "l2": "..." or null, "l3": "..." or null }]`;

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
      placements = JSON.parse(text);
      console.log(`[import] Gemini classified ${placements.length} categories`);
    } catch (err) {
      console.error('[import] Gemini classification failed, using direct creation fallback:', err.message);
    }
  } else {
    console.warn('[import] GEMINI_API_KEY not set — using direct category creation');
  }

  // 4. Fallback: any category not returned by Gemini gets created directly as-is
  const classifiedSources = new Set(placements.map((p) => p.source));
  for (const name of filtered) {
    if (!classifiedSources.has(name)) {
      // Use the raw source name as an L1 category
      placements.push({ source: name, l1: name, l2: null, l3: null });
    }
  }

  // 5. Build resolution map: sourceCategory → resolved platform category name
  const resolution = {};
  for (const p of placements) {
    const { source, l1, l2, l3 } = p;
    if (!source || !l1) continue;
    try {
      const l1Node = await findOrCreate(l1, 1, null);
      let resolvedName = l1Node.name;

      if (l2) {
        const l2Node = await findOrCreate(l2, 2, l1Node.id);
        resolvedName = l2Node.name;
        if (l3) {
          const l3Node = await findOrCreate(l3, 3, l2Node.id);
          resolvedName = l3Node.name;
        }
      }

      resolution[source] = resolvedName;
    } catch (err) {
      console.error(`[import] Failed to create category for "${source}":`, err.message);
    }
  }

  return resolution;
}

// ─── Legacy CSV import (platform-format CSV only) ─────────────────────────────

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
  if (!row.description && !row.short_description) errors.push(`${label}: description is required`);

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
      description: row.description || row.full_description || row.short_description || '',
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

  const groups = new Map();
  for (const row of rows) {
    const key = (row.name ?? '').trim().toLowerCase();
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  let globalRowIdx = 2;
  for (const [, groupRows] of groups) {
    const firstRow = groupRows[0];
    const rowIndex = globalRowIdx;
    globalRowIdx += groupRows.length;

    const { data: productData, errors: productErrors } = validateProductRow(firstRow, rowIndex);
    if (productErrors.length) {
      results.errors.push(...productErrors);
      results.skipped++;
      continue;
    }

    const existing = await prisma.product.findFirst({
      where: { brandProfileId: brand.id, name: productData.name },
    });
    if (existing) { results.skipped++; continue; }

    const variantPayloads = [];
    let hasVariantError = false;

    for (let i = 0; i < groupRows.length; i++) {
      const result = parseVariantRow(groupRows[i], rowIndex + i, productData.wholesalePriceInr);
      if (!result) continue;
      if (result.errors.length) { results.errors.push(...result.errors); hasVariantError = true; }
      else variantPayloads.push(result.data);
    }

    if (hasVariantError) { results.skipped++; continue; }

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

// ─── JSON import (frontend wizard → backend) ──────────────────────────────────
//
// products: pre-parsed product array from the import wizard
// unmatchedCategories: WooCommerce category names that had no platform match
//   — Gemini places these in the L1/L2/L3 tree, creating nodes as needed,
//     then products are remapped to the resolved platform category name.

export const importProductsFromJson = async (userId, products, unmatchedCategories = []) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);
  if (brand.status !== 'APPROVED') throw createError('Brand must be approved to import products', 403);

  if (!Array.isArray(products) || products.length === 0) {
    throw createError('products array is required and must not be empty', 400);
  }

  // Resolve unmatched categories via Gemini, creating missing L1/L2/L3 nodes
  const categoryResolution = await resolveAndCreateCategories(unmatchedCategories);

  const results = { created: 0, skipped: 0, errors: [], categoriesCreated: Object.keys(categoryResolution).length };

  for (const p of products) {
    try {
      if (!p.name?.trim()) {
        results.errors.push('Skipping a product with no name');
        results.skipped++;
        continue;
      }

      const name = p.name.trim().slice(0, 80);
      const description = (p.description ?? '').trim() || name;
      const wholesalePriceInr = Math.max(0.01, Number(p.wholesalePriceInr) || 0.01);
      const moq = Math.max(1, parseInt(p.moq, 10) || 1);
      const weightGrams = Math.max(1, parseInt(p.weightGrams, 10) || 100);
      const leadTime = VALID_LEAD_TIMES.includes(p.leadTime) ? p.leadTime : 'ONE_TO_TWO_WEEKS';
      const enabledZones = (p.enabledZones ?? []).filter((z) => VALID_ZONES.includes(z));
      if (enabledZones.length === 0) enabledZones.push('DOMESTIC');

      // Category: use already-matched value, or fall back to Gemini-resolved name
      let categories = (p.categories ?? []).slice(0, 2).filter(Boolean);
      if (categories.length === 0 && p.sourceCategory && categoryResolution[p.sourceCategory]) {
        categories = [categoryResolution[p.sourceCategory]];
      }

      const tags = (p.tags ?? []).slice(0, 10).filter(Boolean);
      const availability = ['ACTIVE', 'INACTIVE', 'COMING_SOON'].includes(p.availability)
        ? p.availability : 'ACTIVE';

      const existing = await prisma.product.findFirst({ where: { brandProfileId: brand.id, name } });
      if (existing) { results.skipped++; continue; }

      const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const slug = `${base}-${Date.now()}`;

      await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: { name, slug, description, wholesalePriceInr, moq, leadTime, weightGrams, categories, tags, enabledZones, availability, brandProfileId: brand.id },
        });

        // Import product images from CSV
        const imageUrls = (p.images ?? []).filter((u) => u && u.startsWith('http'));
        if (imageUrls.length > 0) {
          await tx.productPhoto.createMany({
            data: imageUrls.slice(0, 5).map((url, idx) => ({
              productId: product.id,
              url,
              publicId: '',
              position: idx,
            })),
          });
        }

        const variants = (p.variants ?? []).filter((v) => v.sku?.trim());
        for (const v of variants) {
          const variant = await tx.productVariant.create({
            data: { productId: product.id, sku: v.sku.trim(), priceInr: Math.max(0.01, Number(v.priceInr) || wholesalePriceInr), stock: Math.max(0, parseInt(v.stock, 10) || 0), status: 'ACTIVE' },
          });
          if (v.attributes?.length) {
            await tx.variantAttribute.createMany({
              data: v.attributes.map((a) => ({ variantId: variant.id, name: String(a.name), value: String(a.value) })),
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
