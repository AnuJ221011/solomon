export const ROLES = {
  BUYER: 'BUYER',
  BRAND: 'BRAND',
  ADMIN: 'ADMIN',
};

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  DISPATCHED: 'DISPATCHED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  DISPUTED: 'DISPUTED',
};

export const BRAND_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
};

export const PRODUCT_AVAILABILITY = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  COMING_SOON: 'COMING_SOON',
};

export const LEAD_TIME = {
  ONE_TO_THREE_DAYS: 'ONE_TO_THREE_DAYS',
  ONE_TO_TWO_WEEKS: 'ONE_TO_TWO_WEEKS',
  TWO_TO_FOUR_WEEKS: 'TWO_TO_FOUR_WEEKS',
};

export const PAYOUT_SPEED = {
  NET_30: 'NET_30',
  EXPRESS: 'EXPRESS',
};

// Express payout fee rate (2.5%)
export const EXPRESS_PAYOUT_FEE = 0.025;

export const RETURN_STATUS = {
  REQUESTED: 'REQUESTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  LABEL_ISSUED: 'LABEL_ISSUED',
  RECEIVED: 'RECEIVED',
  REFUNDED: 'REFUNDED',
};

export const TEAM_ROLE = {
  ADMIN: 'ADMIN',
  CUSTOM: 'CUSTOM',
};

export const PROMOTION_SCOPE = {
  CATALOG: 'CATALOG',
  COLLECTION: 'COLLECTION',
};

export const STORE_TYPES = ['boutique', 'gift_shop', 'subscription_box', 'online_store', 'pop_up', 'other'];
export const AESTHETICS = ['minimalist', 'bohemian', 'artisan', 'luxury', 'contemporary', 'eclectic'];

// Opening order return window in days
export const OPENING_ORDER_RETURN_DAYS = 30;

// Share link attribution window in days (0% commission)
export const SHARE_LINK_ATTRIBUTION_DAYS = 30;
