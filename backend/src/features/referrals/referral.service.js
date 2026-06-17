import prisma from '../../config/db.js';
import { createError } from '../../shared/utils/createError.js';
import { sendReferralRewardEmail } from '../../shared/utils/email.js';

const REWARD_INR = 500;
const BONUS_INR = 500;
const CREDIT_EXPIRY_MONTHS = 12;
const BONUS_WINDOW_DAYS = 90;

export const getReferralStats = async (userId) => {
  // Get or auto-create the buyer's personal referral token (null referredBrandId = master token row)
  let master = await prisma.buyerReferral.findFirst({
    where: { referrerUserId: userId, referredBrandId: null },
  });
  if (!master) {
    master = await prisma.buyerReferral.create({ data: { referrerUserId: userId } });
  }

  const baseUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  const referralLink = `${baseUrl}/apply?ref=${master.token}`;

  // All referrals that were actually used (brand signed up)
  const used = await prisma.buyerReferral.findMany({
    where: { referrerUserId: userId, referredBrandId: { not: null } },
    include: {
      referredBrand: {
        select: { user: { select: { email: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return {
    referralLink,
    totalReferrals: used.length,
    pendingCount: used.filter((r) => !r.rewardIssued).length,
    referrals: used.map((r) => ({
      id: r.id,
      referredEmail: r.referredBrand?.user?.email ?? null,
      status: r.rewardIssued ? 'CONVERTED' : 'PENDING',
      createdAt: r.createdAt,
    })),
  };
};

export const recordReferralSignup = async (referralToken, newBrandId) => {
  const referral = await prisma.buyerReferral.findUnique({ where: { token: referralToken } });
  if (!referral) return;

  await prisma.buyerReferral.update({
    where: { id: referral.id },
    data: { referredBrandId: newBrandId },
  });
};

export const processReferralReward = async (brandProfileId) => {
  const referral = await prisma.buyerReferral.findFirst({
    where: { referredBrandId: brandProfileId, rewardIssued: false },
  });
  if (!referral) return;

  await issueCredit(referral.referrerUserId, REWARD_INR, 'Referral reward: brand completed first sale');

  await prisma.buyerReferral.update({
    where: { id: referral.id },
    data: { rewardIssued: true },
  });

  // Notify referrer
  const referrer = await prisma.user.findUnique({ where: { id: referral.referrerUserId } });
  const brand = await prisma.brandProfile.findUnique({ where: { id: brandProfileId } });
  if (referrer && brand) {
    await sendReferralRewardEmail(referrer.email, {
      buyerName: referrer.name,
      brandName: brand.brandName,
      creditAmountInr: REWARD_INR,
    }).catch(() => {});
  }
};

export const processBonusIfEligible = async (brandProfileId) => {
  const referral = await prisma.buyerReferral.findFirst({
    where: { referredBrandId: brandProfileId, rewardIssued: true, bonusIssued: false },
  });
  if (!referral) return;

  const brand = await prisma.brandProfile.findUnique({ where: { id: brandProfileId } });
  if (brand.achievementLevel !== 'L2_RISING') return;

  const daysSinceReferral = (Date.now() - referral.createdAt.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceReferral > BONUS_WINDOW_DAYS) return;

  await issueCredit(referral.referrerUserId, BONUS_INR, 'Referral bonus: brand reached Rising within 90 days');

  await prisma.buyerReferral.update({
    where: { id: referral.id },
    data: { bonusIssued: true },
  });
};

export const getWallet = async (userId) => {
  return prisma.wallet.findUnique({
    where: { userId },
    include: {
      credits: {
        where: { status: { in: ['ACTIVE', 'PENDING'] } },
        orderBy: { expiresAt: 'asc' },
      },
    },
  });
};

const issueCredit = async (userId, amountInr, reason) => {
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw createError('Wallet not found', 404);

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + CREDIT_EXPIRY_MONTHS);

  await prisma.$transaction([
    prisma.walletCredit.create({
      data: { walletId: wallet.id, amountInr, reason, expiresAt, status: 'ACTIVE' },
    }),
    prisma.wallet.update({
      where: { id: wallet.id },
      data: { balanceInr: { increment: amountInr } },
    }),
  ]);
};

/**
 * Returns the top 20 referrers this calendar month plus the requesting buyer's rank.
 */
export const getLeaderboard = async (requestingUserId) => {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  // Count brands successfully referred (reward issued) per referrer in this month
  const rows = await prisma.buyerReferral.groupBy({
    by: ['referrerUserId'],
    where: { rewardIssued: true, updatedAt: { gte: monthStart } },
    _count: { referrerUserId: true },
    orderBy: { _count: { referrerUserId: 'desc' } },
    take: 20,
  });

  // Enrich with user names
  const enriched = await Promise.all(
    rows.map(async (r, idx) => {
      const user = await prisma.user.findUnique({
        where: { id: r.referrerUserId },
        select: { name: true },
      });
      return { rank: idx + 1, userId: r.referrerUserId, name: user?.name ?? 'Unknown', referrals: r._count.referrerUserId };
    })
  );

  // Find requesting user's rank
  const allRows = await prisma.buyerReferral.groupBy({
    by: ['referrerUserId'],
    where: { rewardIssued: true, updatedAt: { gte: monthStart } },
    _count: { referrerUserId: true },
    orderBy: { _count: { referrerUserId: 'desc' } },
  });

  const myIndex = allRows.findIndex((r) => r.referrerUserId === requestingUserId);
  const myCount = myIndex >= 0 ? allRows[myIndex]._count.referrerUserId : 0;
  const myRank = myIndex >= 0 ? myIndex + 1 : null;
  const totalBuyers = await prisma.user.count({ where: { role: 'BUYER' } });
  const percentile = myRank ? Math.round((1 - myRank / totalBuyers) * 100) : null;

  return {
    rank: myRank,
    total: totalBuyers,
    leaderboard: enriched.map((e) => ({
      rank: e.rank,
      name: e.name,
      count: e.referrals,
      isCurrentUser: e.userId === requestingUserId,
    })),
  };
};
