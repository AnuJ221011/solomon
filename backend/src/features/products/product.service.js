import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';
import { validateCategories } from '../categories/index.js';

export const createProduct = async (userId, data) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);
  if (brand.status !== 'APPROVED') throw createError('Brand must be approved to list products', 403);

  // Validate that all supplied categories exist in the Category table
  if (data.categories?.length) await validateCategories(data.categories);

  const slug = `${data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;

  return prisma.product.create({
    data: { ...data, slug, brandProfileId: brand.id },
    include: { photos: true, variants: true },
  });
};

export const updateProduct = async (userId, productId, data) => {
  const product = await getOwnedProduct(userId, productId);
  return prisma.product.update({
    where: { id: product.id },
    data,
    include: { photos: true, variants: true },
  });
};

export const deleteProduct = async (userId, productId) => {
  await getOwnedProduct(userId, productId);
  await prisma.product.delete({ where: { id: productId } });
};

export const getProductById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      photos: { orderBy: { position: 'asc' } },
      variants: { include: { attributes: { orderBy: { name: 'asc' } } }, orderBy: { createdAt: 'asc' } },
      brandProfile: { select: { id: true, brandName: true, slug: true, achievementLevel: true, logoUrl: true, minimumOrderValue: true } },
    },
  });
  if (!product) throw createError('Product not found', 404);
  return product;
};

export const getProductBySlug = async (slug) => {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      photos: { orderBy: { position: 'asc' } },
      variants: { include: { attributes: { orderBy: { name: 'asc' } } }, orderBy: { createdAt: 'asc' } },
      brandProfile: { select: { id: true, brandName: true, slug: true, achievementLevel: true, logoUrl: true, minimumOrderValue: true } },
    },
  });
  if (!product) throw createError('Product not found', 404);
  return product;
};

export const listProducts = async ({
  page, limit, search, category, zone, minPrice, maxPrice,
  availability, brandId, brandSlug, sortBy, sortOrder,
  // Personalisation context (passed when a logged-in buyer fetches the feed)
  buyerUserId,
  // Attribute filters: JSON string of { [attrName]: string[] }
  attrs,
  // Brand minimum order value ceiling (e.g. 5000 → only brands with MOV ≤ ₹5,000)
  brandMaxMin,
}) => {
  const where = {};
  where.availability = availability ?? 'ACTIVE';

  // Resolve brandSlug → brandProfileId when brandId not explicitly provided
  if (brandSlug && !brandId) {
    const brand = await prisma.brandProfile.findUnique({ where: { slug: brandSlug }, select: { id: true } });
    if (brand) brandId = brand.id;
  }
  if (brandId) where.brandProfileId = brandId;

  if (category) {
    const slugs = Array.isArray(category)
      ? category
      : String(category).split(',').map((s) => s.trim()).filter(Boolean);

    // Resolve slugs → category names (products store names, not slugs)
    const resolved = await Promise.all(
      slugs.map(async (s) => {
        // Also handle L2 category: look up L2, and if the product categories field uses L2 names
        const found = await prisma.category.findUnique({ where: { slug: s }, select: { name: true } });
        return found ? found.name : s; // fall back to the raw value if not a slug
      })
    );
    where.categories = resolved.length === 1 ? { has: resolved[0] } : { hasSome: resolved };
  }

  // Attribute value filters: { Fabric: ['Cotton', 'Linen'], Technique: ['Hand block print'] }
  if (attrs) {
    let attrFilters;
    try {
      attrFilters = typeof attrs === 'string' ? JSON.parse(attrs) : attrs;
    } catch {
      attrFilters = null;
    }
    if (attrFilters && typeof attrFilters === 'object') {
      const andConditions = [];
      for (const [attrName, values] of Object.entries(attrFilters)) {
        const vals = Array.isArray(values) ? values.filter(Boolean) : [];
        if (vals.length === 0) continue;
        andConditions.push({
          attributeValues: {
            some: {
              attribute: { name: attrName },
              value: vals.length === 1 ? vals[0] : { in: vals },
            },
          },
        });
      }
      if (andConditions.length > 0) {
        where.AND = [...(where.AND ?? []), ...andConditions];
      }
    }
  }

  if (zone) where.enabledZones = { has: zone };

  if (minPrice || maxPrice) {
    where.wholesalePriceInr = {};
    if (minPrice) where.wholesalePriceInr.gte = Number(minPrice);
    if (maxPrice) where.wholesalePriceInr.lte = Number(maxPrice);
  }

  if (brandMaxMin) {
    where.brandProfile = { minimumOrderValue: { lte: Number(brandMaxMin) } };
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { shortDescription: { contains: search, mode: 'insensitive' } },
      { tags: { has: search } },
    ];
  }

  // Fetch buyer profile for personalisation if user is logged in
  let buyerProfile = null;
  if (buyerUserId) {
    buyerProfile = await prisma.buyerProfile.findUnique({
      where: { userId: buyerUserId },
      select: { storeType: true, aesthetic: true, categoryInterests: true },
    });
  }

  // When no explicit sort is requested, use ranked discovery order
  const useRanking = !sortBy || sortBy === 'rank';

  // For ranked feed: fetch more candidates and sort in-process
  const fetchLimit = useRanking ? Math.min(limit * 4, 200) : limit;
  const fetchSkip = useRanking ? 0 : (page - 1) * limit;

  const [rawProducts, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: fetchSkip,
      take: fetchLimit,
      orderBy: useRanking ? undefined : { [sortBy]: sortOrder },
      include: {
        photos: { orderBy: { position: 'asc' }, take: 1 },
        brandProfile: {
          select: {
            brandName: true, slug: true,
            achievementLevel: true, avgRating: true,
            avgDispatchDays: true, category: true,
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  let products = rawProducts;

  if (useRanking) {
    products = await _rankProducts(rawProducts, buyerProfile);
    // Apply page window after ranking
    const start = (page - 1) * limit;
    products = products.slice(start, start + limit);
  }

  return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Scores and sorts products using the PRD ranking signals.
 * Higher score = higher in feed.
 */
const LEVEL_BOOST = { L5_LEGEND: 5, L4_ELITE: 4, L3_TRUSTED: 3, L2_RISING: 2, L1_SPROUT: 1 };

const _getActivePromotedIds = async () => {
  const now = new Date();
  const rows = await prisma.promotedListing.findMany({
    where: {
      isActive: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
    select: { productId: true, bidAmountInr: true },
  });
  // Record impression counts (fire-and-forget)
  if (rows.length) {
    prisma.promotedListing.updateMany({
      where: { productId: { in: rows.map((r) => r.productId) }, isActive: true },
      data: { impressions: { increment: 1 } },
    }).catch(() => {});
  }
  return new Map(rows.map((r) => [r.productId, Number(r.bidAmountInr)]));
};

const _rankProducts = async (products, buyerProfile) => {
  const promotedIds = await _getActivePromotedIds();

  const scored = products.map((p) => {
    let score = 0;
    const brand = p.brandProfile;

    // Promoted listing boost — proportional to bid amount
    if (promotedIds.has(p.id)) {
      score += 10 + Math.min(promotedIds.get(p.id) / 500, 5); // base 10 + up to 5 extra
    }

    // Achievement level boost (0–5)
    score += LEVEL_BOOST[brand.achievementLevel] ?? 1;

    // Brand avg rating (0–5 mapped to 0–3 extra points)
    score += ((brand.avgRating ?? 0) / 5) * 3;

    // On-time dispatch: avg dispatch ≤ 5 days earns bonus
    if (brand.avgDispatchDays > 0 && brand.avgDispatchDays <= 5) score += 2;
    else if (brand.avgDispatchDays > 0 && brand.avgDispatchDays <= 10) score += 1;

    // Product conversion rate (orderCount / viewCount)
    const conversionRate = p.viewCount > 0 ? p.orderCount / p.viewCount : 0;
    score += Math.min(conversionRate * 10, 3); // cap at 3

    // Catalogue freshness: products listed in last 30 days
    const ageMs = Date.now() - new Date(p.createdAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays <= 7) score += 3;
    else if (ageDays <= 30) score += 1.5;

    // Personalisation: buyer category interests match
    if (buyerProfile?.categoryInterests?.length) {
      const matchCount = p.categories.filter((c) =>
        buyerProfile.categoryInterests.some((i) => c.toLowerCase().includes(i.toLowerCase()))
      ).length;
      score += matchCount * 2;
    }

    // Personalisation: brand category match with buyer's store type
    if (buyerProfile?.storeType && brand.category?.length) {
      // Simple heuristic: artisan store type → boost handcraft/textile brands
      const artisanTypes = ['boutique', 'gift_shop'];
      if (artisanTypes.includes(buyerProfile.storeType)) score += 1;
    }

    return { ...p, _score: score };
  });

  return scored.sort((a, b) => b._score - a._score);
};


export const listMyProducts = async (userId, query) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);
  return listProducts({ ...query, brandId: brand.id });
};

// Ensures a product belongs to the requesting brand
const getOwnedProduct = async (userId, productId) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) throw createError('Brand profile not found', 404);

  const product = await prisma.product.findFirst({
    where: { id: productId, brandProfileId: brand.id },
  });
  if (!product) throw createError('Product not found or access denied', 404);
  return product;
};
