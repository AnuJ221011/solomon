// Commission, fee, and payout-window constants — kept separate from the role/
// status enums in roles.js so the numbers that drive money and payout timing
// live in one place. Per-achievement-tier commission rates are in
// achievements.js (ACHIEVEMENT_LEVELS[...].commissionRate) since they're keyed
// by tier rather than flat constants.

// Express payout fee rate (2.5%)
export const EXPRESS_PAYOUT_FEE = 0.025;

// Opening order return window in days
export const OPENING_ORDER_RETURN_DAYS = 30;

// Share link attribution window in days (0% commission)
export const SHARE_LINK_ATTRIBUTION_DAYS = 30;
