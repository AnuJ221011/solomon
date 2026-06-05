import { Router } from 'express';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { getBrandProgress } from './achievement.service.js';
import { ACHIEVEMENT_LEVELS } from '../../shared/constants/achievements.js';
import prisma from '../../config/db.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { createError } from '../../shared/utils/createError.js';
import { env } from '../../config/env.js';

const router = Router();

router.get('/progress', authenticate, authorize('BRAND'), async (req, res) => {
  const progress = await getBrandProgress(req.user.id);
  sendSuccess(res, progress);
});

/**
 * GET /api/achievements/social-card
 * Returns the data needed to render a shareable social card for the brand's current level.
 * Frontend renders this as an OG image or shareable graphic.
 */
router.get('/social-card', authenticate, authorize('BRAND'), async (req, res) => {
  const brand = await prisma.brandProfile.findUnique({
    where: { userId: req.user.id },
    select: { brandName: true, achievementLevel: true, slug: true, logoUrl: true, confirmedOrderCount: true, avgRating: true },
  });
  if (!brand) throw createError('Brand profile not found', 404);

  const levelConfig = ACHIEVEMENT_LEVELS[brand.achievementLevel];
  const shareUrl = `${env.CLIENT_URL}/brands/${brand.slug}`;

  sendSuccess(res, {
    brandName: brand.brandName,
    brandSlug: brand.slug,
    logoUrl: brand.logoUrl,
    level: brand.achievementLevel,
    levelName: levelConfig.name,
    levelNumber: levelConfig.level,
    commissionRate: `${levelConfig.commissionRate * 100}%`,
    stats: {
      confirmedOrders: brand.confirmedOrderCount,
      avgRating: brand.avgRating,
    },
    shareUrl,
    cardImageUrl: `${env.CLIENT_URL}/api/og/achievement?brand=${brand.slug}&level=${brand.achievementLevel}`,
    message: `${brand.brandName} has reached ${levelConfig.name} level on Solomon Bharat! 🎉`,
  });
});

export default router;
