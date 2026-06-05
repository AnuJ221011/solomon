export const ACHIEVEMENT_LEVELS = {
  L1_SPROUT: {
    level: 1,
    name: 'Sprout',
    commissionRate: 0.15,
    criteria: {
      profileComplete: true,
      minActiveListings: 3,
    },
  },
  L2_RISING: {
    level: 2,
    name: 'Rising',
    commissionRate: 0.14,
    criteria: {
      minConfirmedOrders: 5,
      maxAvgDispatchDays: 5,
      noDisputes: true,
    },
  },
  L3_TRUSTED: {
    level: 3,
    name: 'Trusted',
    commissionRate: 0.14,
    criteria: {
      minConfirmedOrders: 25,
      minAvgRating: 4.2,
      minActiveListings: 10,
    },
  },
  L4_ELITE: {
    level: 4,
    name: 'Elite',
    commissionRate: 0.12,
    criteria: {
      minConfirmedOrders: 100,
      minAvgRating: 4.5,
      minGmvInr: 500000, // ₹5L
      unresolvedDisputes: 0,
    },
  },
  L5_LEGEND: {
    level: 5,
    name: 'Legend',
    commissionRate: 0.10,
    criteria: {
      minConfirmedOrders: 500,
      minAvgRating: 4.7,
      minGmvInr: 2500000, // ₹25L
      minRepeatInternationalBuyers: 3,
    },
  },
};

export const LEVEL_ORDER = [
  'L1_SPROUT',
  'L2_RISING',
  'L3_TRUSTED',
  'L4_ELITE',
  'L5_LEGEND',
];

export const getCommissionRate = (levelKey) =>
  ACHIEVEMENT_LEVELS[levelKey]?.commissionRate ?? 0.15;
