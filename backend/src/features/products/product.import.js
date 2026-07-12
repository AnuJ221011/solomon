import { GoogleGenerativeAI } from '@google/generative-ai';
import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';
import { ACHIEVEMENT_LEVELS } from '../../shared/constants/achievements.js';
import { env } from '../../config/env.js';
import { logger } from '../../shared/utils/logger.js';

const MIN_BULK_IMPORT_LEVEL = ACHIEVEMENT_LEVELS.L3_TRUSTED.level;

const VALID_LEAD_TIMES = ['ONE_TO_THREE_DAYS', 'ONE_TO_TWO_WEEKS', 'TWO_TO_FOUR_WEEKS'];
const VALID_ZONES = ['DOMESTIC', 'SOUTH_ASIA', 'SOUTHEAST_ASIA', 'MIDDLE_EAST', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'REST_OF_WORLD'];

// ─── Category resolution (existing taxonomy only — never creates new nodes) ──
//
// Category creation is admin-only (via the Categories tab) — imports must
// never create ad-hoc categories the way this used to (Gemini would place
// unmatched WooCommerce/Shopify category names into new L1/L2/L3 nodes).
// Anything that doesn't match an existing active category name falls back
// to "Other" instead.

async function loadActiveCategoryLookup() {
  const cats = await prisma.category.findMany({ where: { isActive: true }, select: { name: true } });
  const byLower = new Map();
  for (const c of cats) byLower.set(c.name.toLowerCase(), c.name);
  return byLower;
}

/** Resolves raw category name(s) to existing platform category names, falling
 *  back to "Other" for anything unmatched. Always returns at least ["Other"]. */
function resolveCategoryNames(rawNames, byLower) {
  const resolved = [];
  for (const raw of (rawNames ?? [])) {
    const trimmed = (raw ?? '').trim();
    if (!trimmed || trimmed.toLowerCase() === 'uncategorized') continue;
    resolved.push(byLower.get(trimmed.toLowerCase()) ?? 'Other');
  }
  const deduped = [...new Set(resolved)];
  return (deduped.length ? deduped : ['Other']).slice(0, 2);
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

  const brandLevel = ACHIEVEMENT_LEVELS[brand.achievementLevel]?.level ?? 1;
  if (brandLevel < MIN_BULK_IMPORT_LEVEL) {
    throw createError('Bulk CSV import is available to Trusted-tier brands and above', 403);
  }

  const rows = parseCsv(csvText);
  const results = { created: 0, skipped: 0, errors: [] };
  const categoryLookup = await loadActiveCategoryLookup();

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

    productData.categories = resolveCategoryNames(productData.categories, categoryLookup);

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

// ─── Import-time description polishing ────────────────────────────────────────
//
// WooCommerce/Shopify exports carry the description as raw HTML
// (e.g. "<ul><li><b>Material:</b> ...</li></ul>"). Stored as-is, that markup
// shows up as literal tags on the storefront. Gemini rewrites it into clean
// plain text — preserving every bullet's content — with a regex-based
// fallback so imports still work without an HTML-to-text conversion when
// GEMINI_API_KEY is unset or the call fails.

const HTML_TAG_RE = /<[a-z][\s\S]*>/i;

function stripHtmlToPlainText(html) {
  const text = html
    .replace(/<li[^>]*>/gi, '\n- ')
    .replace(/<\/(li|p|div|h[1-6])>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/gi, '&').replace(/&nbsp;/gi, ' ').replace(/&#39;/g, "'").replace(/&quot;/gi, '"')
    .replace(/[ \t]+/g, ' ');

  return text.split('\n').map((l) => l.trim()).filter(Boolean).join('\n');
}

async function polishImportDescription(genAI, rawDescription) {
  if (!HTML_TAG_RE.test(rawDescription)) return rawDescription;

  const fallback = stripHtmlToPlainText(rawDescription);
  if (!genAI) return fallback;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    const prompt = `You are a product content editor for a B2B wholesale marketplace selling Indian artisan goods.
Convert this HTML product description into clean, well-formatted plain text for wholesale buyers:
- Strip all HTML tags
- Turn each <li> into its own "- " bullet line
- Keep bold labels like "<b>Material:</b>" as plain "Material:" (no markdown asterisks)
- Do NOT add, remove, or change any factual information — preserve every bullet's content
- Collapse extra whitespace and blank lines

Return ONLY the cleaned plain-text description, no explanation.

Input:
${rawDescription}`;
    const result = await model.generateContent(prompt);
    const cleaned = result.response.text().trim();
    return cleaned || fallback;
  } catch (err) {
    logger.error('[import] Gemini description polish failed, using fallback', { error: err.message });
    return fallback;
  }
}

// Polishes descriptions with limited concurrency so large imports don't
// serialize one Gemini call after another.
const POLISH_CONCURRENCY = 5;

async function polishDescriptions(genAI, rawDescriptions) {
  const polished = new Array(rawDescriptions.length);
  for (let i = 0; i < rawDescriptions.length; i += POLISH_CONCURRENCY) {
    const batchIdxs = rawDescriptions.slice(i, i + POLISH_CONCURRENCY).map((_, j) => i + j);
    const results = await Promise.all(
      batchIdxs.map((idx) => polishImportDescription(genAI, rawDescriptions[idx])),
    );
    results.forEach((r, j) => { polished[batchIdxs[j]] = r; });
  }
  return polished;
}

// ─── JSON import (frontend wizard → backend) ──────────────────────────────────
//
// products: pre-parsed product array from the import wizard
// Any product whose category didn't match the existing platform taxonomy
// (client-side matching already tried name/slug/substring — see sourceCategory)
// falls back to "Other" rather than creating a new category.

export const importProductsFromJson = async (userId, products) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);
  if (brand.status !== 'APPROVED') throw createError('Brand must be approved to import products', 403);

  if (!Array.isArray(products) || products.length === 0) {
    throw createError('products array is required and must not be empty', 400);
  }

  const categoryLookup = await loadActiveCategoryLookup();

  // Clean up HTML descriptions from the source CSV before they're stored
  const genAI = env.GEMINI_API_KEY ? new GoogleGenerativeAI(env.GEMINI_API_KEY) : null;
  const polishedDescriptions = await polishDescriptions(genAI, products.map((p) => (p.description ?? '').trim()));

  const results = { created: 0, skipped: 0, errors: [] };

  for (let productIdx = 0; productIdx < products.length; productIdx++) {
    const p = products[productIdx];
    try {
      if (!p.name?.trim()) {
        results.errors.push('Skipping a product with no name');
        results.skipped++;
        continue;
      }

      const name = p.name.trim().slice(0, 80);
      const description = polishedDescriptions[productIdx] || name;
      const wholesalePriceInr = Math.max(0.01, Number(p.wholesalePriceInr) || 0.01);
      const moq = Math.max(1, parseInt(p.moq, 10) || 1);
      const weightGrams = Math.max(1, parseInt(p.weightGrams, 10) || 100);
      const leadTime = VALID_LEAD_TIMES.includes(p.leadTime) ? p.leadTime : 'ONE_TO_TWO_WEEKS';
      const enabledZones = (p.enabledZones ?? []).filter((z) => VALID_ZONES.includes(z));
      if (enabledZones.length === 0) enabledZones.push('DOMESTIC');

      // Category: use already-matched value, or resolve sourceCategory against
      // the existing taxonomy — falls back to "Other" if nothing matches.
      let categories = (p.categories ?? []).slice(0, 2).filter(Boolean);
      if (categories.length === 0) {
        categories = resolveCategoryNames(p.sourceCategory ? [p.sourceCategory] : [], categoryLookup);
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
