import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';

const VALID_LEAD_TIMES = ['ONE_TO_THREE_DAYS', 'ONE_TO_TWO_WEEKS', 'TWO_TO_FOUR_WEEKS'];
const VALID_ZONES = ['DOMESTIC', 'SOUTH_ASIA', 'SOUTHEAST_ASIA', 'MIDDLE_EAST', 'EUROPE', 'NORTH_AMERICA', 'OCEANIA', 'REST_OF_WORLD'];

/**
 * Parses a CSV string into an array of row objects.
 * First row is treated as the header.
 */
export const parseCsv = (csvText) => {
  const lines = csvText.trim().split('\n').map((l) => l.trim());
  if (lines.length < 2) throw createError('CSV must have a header row and at least one data row', 400);

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));

  return lines.slice(1).map((line, idx) => {
    // Handle quoted values with commas inside
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

/**
 * Validates and transforms a parsed CSV row into a product create payload.
 * Returns { data, errors } — errors is an array of strings.
 */
const validateRow = (row, rowIndex) => {
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

  const zones = (row.shipping_zones ?? '').split('|').map((z) => z.trim().toUpperCase());
  const invalidZones = zones.filter((z) => z && !VALID_ZONES.includes(z));
  if (invalidZones.length) errors.push(`${label}: invalid shipping zones: ${invalidZones.join(', ')}`);

  if (errors.length) return { data: null, errors };

  return {
    errors: [],
    data: {
      name: row.name,
      shortDescription: row.short_description,
      fullDescription: row.full_description || null,
      wholesalePriceInr: price,
      msrpInr: row.msrp_inr ? parseFloat(row.msrp_inr) : null,
      moq,
      leadTime,
      weightGrams: weight,
      hsTariffCode: row.hs_tariff_code || null,
      countryOfOrigin: row.country_of_origin || 'IN',
      categories: (row.categories ?? '').split('|').map((c) => c.trim()).filter(Boolean),
      tags: (row.tags ?? '').split('|').map((t) => t.trim()).filter(Boolean).slice(0, 10),
      enabledZones: zones.filter(Boolean),
      availability: 'ACTIVE',
    },
  };
};

/**
 * Imports products from a CSV text string for a brand.
 * Returns { created, skipped, errors }.
 */
export const importProductsFromCsv = async (userId, csvText) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);
  if (brand.status !== 'APPROVED') throw createError('Brand must be approved to import products', 403);

  const rows = parseCsv(csvText);
  const results = { created: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const { data, errors } = validateRow(rows[i], i + 2);

    if (errors.length) {
      results.errors.push(...errors);
      results.skipped++;
      continue;
    }

    const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}-${i}`;

    await prisma.product.create({
      data: { ...data, slug, brandProfileId: brand.id },
    });

    results.created++;
  }

  return results;
};
