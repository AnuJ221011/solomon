import prisma from '../../config/db.js';
import { ACHIEVEMENT_LEVELS, LEVEL_ORDER } from '../../shared/constants/achievements.js';
import { sendAchievementEmail } from '../../shared/utils/email.js';
import { logger } from '../../shared/utils/logger.js';

export const recalculateAchievement = async (brandProfileId) => {
  const brand = await prisma.brandProfile.findUnique({
    where: { id: brandProfileId },
    include: { user: { select: { email: true } } },
  });
  if (!brand || brand.isAdminOverride) return;

  const stats = await getBrandStats(brandProfileId);
  const newLevel = computeLevel(stats);

  if (newLevel !== brand.achievementLevel) {
    await prisma.brandProfile.update({
      where: { id: brandProfileId },
      data: { achievementLevel: newLevel },
    });

    logger.info(`Brand ${brand.brandName} levelled up to ${newLevel}`);
    const levelConfig = ACHIEVEMENT_LEVELS[newLevel];
    await sendAchievementEmail(brand.user.email, brand.brandName, levelConfig.name).catch(() => {});
  }
};

const getBrandStats = async (brandProfileId) => {
  const [confirmedOrders, activeListings, unresolvedDisputes, repeatInternationalBuyers] = await Promise.all([
    prisma.order.count({
      where: { brandProfileId, status: { in: ['CONFIRMED', 'DISPATCHED', 'DELIVERED'] } },
    }),
    prisma.product.count({
      where: { brandProfileId, availability: 'ACTIVE' },
    }),
    prisma.order.count({
      where: { brandProfileId, status: 'DISPUTED' },
    }),
    prisma.order.groupBy({
      by: ['buyerUserId'],
      where: { brandProfileId, status: 'DELIVERED', shippingZone: { not: 'DOMESTIC' } },
      having: { buyerUserId: { _count: { gte: 2 } } },
    }),
  ]);

  const brand = await prisma.brandProfile.findUnique({
    where: { id: brandProfileId },
    select: { avgRating: true, totalGmvInr: true, confirmedOrderCount: true, avgDispatchDays: true },
  });

  return {
    confirmedOrders,
    activeListings,
    unresolvedDisputes,
    repeatInternationalBuyers: repeatInternationalBuyers.length,
    avgRating: brand.avgRating,
    totalGmvInr: Number(brand.totalGmvInr),
    avgDispatchDays: brand.avgDispatchDays ?? 0,
    profileComplete: true,
  };
};

const computeLevel = (stats) => {
  let currentLevel = 'L1_SPROUT';
  for (const key of LEVEL_ORDER) {
    const { criteria } = ACHIEVEMENT_LEVELS[key];
    if (meetsLevelCriteria(stats, criteria)) {
      currentLevel = key;
    } else {
      break;
    }
  }
  return currentLevel;
};

const meetsLevelCriteria = (stats, criteria) => {
  if (criteria.profileComplete && !stats.profileComplete) return false;
  if (criteria.minActiveListings && stats.activeListings < criteria.minActiveListings) return false;
  if (criteria.minConfirmedOrders && stats.confirmedOrders < criteria.minConfirmedOrders) return false;
  if (criteria.noDisputes && stats.unresolvedDisputes > 0) return false;
  if (criteria.unresolvedDisputes === 0 && stats.unresolvedDisputes > 0) return false;
  // L2 dispatch speed criterion: avgDispatchDays must be ≤ maxAvgDispatchDays
  if (criteria.maxAvgDispatchDays && stats.avgDispatchDays > 0 && stats.avgDispatchDays > criteria.maxAvgDispatchDays) return false;
  if (criteria.minAvgRating && stats.avgRating < criteria.minAvgRating) return false;
  if (criteria.minGmvInr && stats.totalGmvInr < criteria.minGmvInr) return false;
  if (criteria.minRepeatInternationalBuyers && stats.repeatInternationalBuyers < criteria.minRepeatInternationalBuyers) return false;
  return true;
};

export const getBrandProgress = async (userId) => {
  const brand = await prisma.brandProfile.findUnique({ where: { userId } });
  if (!brand) return null;

  const stats = await getBrandStats(brand.id);
  const currentIndex = LEVEL_ORDER.indexOf(brand.achievementLevel);
  const nextLevelKey = LEVEL_ORDER[currentIndex + 1];
  const nextLevel = nextLevelKey ? ACHIEVEMENT_LEVELS[nextLevelKey] : null;

  return {
    currentLevel: brand.achievementLevel,
    currentLevelConfig: ACHIEVEMENT_LEVELS[brand.achievementLevel],
    nextLevel: nextLevel ? { key: nextLevelKey, ...nextLevel } : null,
    stats,
  };
};
