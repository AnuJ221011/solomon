import prisma from '../../config/db.js';
import { sendWeeklyDigest } from '../../shared/utils/email.js';
import { logger } from '../../shared/utils/logger.js';

const PRODUCTS_PER_DIGEST = 6;
const FRESHNESS_DAYS = 7;

/**
 * Builds and sends a personalised weekly digest to every eligible buyer.
 *
 * Eligible buyer:
 *  - isEmailVerified = true
 *  - isActive = true
 *  - has a buyerProfile (i.e. not a brand/admin)
 *
 * Personalisation: uses storeType + categoryInterests from the store type quiz.
 * Falls back to top-ranked new products if preferences are empty.
 */
export const sendWeeklyDigests = async () => {
  logger.info('Weekly digest job starting');

  const buyers = await prisma.user.findMany({
    where: { role: 'BUYER', isEmailVerified: true, isActive: true },
    include: {
      buyerProfile: {
        select: { businessName: true, categoryInterests: true, storeType: true },
      },
    },
  });

  const cutoff = new Date(Date.now() - FRESHNESS_DAYS * 24 * 60 * 60 * 1000);

  let sent = 0;
  let skipped = 0;

  for (const buyer of buyers) {
    if (!buyer.buyerProfile) { skipped++; continue; }

    const { categoryInterests } = buyer.buyerProfile;

    // Build WHERE clause — prefer matching categories, fall back to all active
    const where = { availability: 'ACTIVE' };
    if (categoryInterests?.length) {
      where.OR = categoryInterests.map((c) => ({
        categories: { has: c },
      }));
    }

    // Prioritise products created in the last 7 days; backfill with top-ordered
    let products = await prisma.product.findMany({
      where: { ...where, createdAt: { gte: cutoff } },
      take: PRODUCTS_PER_DIGEST,
      orderBy: { orderCount: 'desc' },
      include: {
        photos: { orderBy: { position: 'asc' }, take: 1 },
        brandProfile: { select: { brandName: true } },
      },
    });

    // Backfill with all-time top products if not enough fresh ones
    if (products.length < PRODUCTS_PER_DIGEST) {
      const existingIds = products.map((p) => p.id);
      const backfill = await prisma.product.findMany({
        where: { ...where, id: { notIn: existingIds } },
        take: PRODUCTS_PER_DIGEST - products.length,
        orderBy: { orderCount: 'desc' },
        include: {
          photos: { orderBy: { position: 'asc' }, take: 1 },
          brandProfile: { select: { brandName: true } },
        },
      });
      products = [...products, ...backfill];
    }

    if (products.length === 0) { skipped++; continue; }

    const digestProducts = products.map((p) => ({
      name: p.name,
      slug: p.slug,
      brandName: p.brandProfile.brandName,
      wholesalePriceInr: Number(p.wholesalePriceInr),
    }));

    await sendWeeklyDigest(buyer.email, {
      buyerName: buyer.buyerProfile.businessName ?? buyer.name,
      products: digestProducts,
    }).catch((err) => {
      logger.warn('Digest email failed', { email: buyer.email, error: err.message });
    });

    sent++;
  }

  logger.info('Weekly digest job complete', { sent, skipped, total: buyers.length });
  return { sent, skipped };
};
