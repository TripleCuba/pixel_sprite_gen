export const BillingProductId = {
  pack100: 'pack_100',
  pack400: 'pack_400',
  pack1000: 'pack_1000',
  hobby: 'hobby',
  creator: 'creator',
  studio: 'studio',
} as const;

export type BillingProductId = (typeof BillingProductId)[keyof typeof BillingProductId];

type BillingProduct = {
  creditAmount: number;
  envKey: string;
  kind: 'payment' | 'subscription';
  plan?: 'hobby' | 'creator' | 'studio';
  storageLimitBytes?: number;
};

const MEBIBYTE = 1024 * 1024;

export const BILLING_PRODUCTS: Record<BillingProductId, BillingProduct> = {
  [BillingProductId.pack100]: {
    creditAmount: 100,
    envKey: 'STRIPE_PRICE_PACK_100',
    kind: 'payment',
  },
  [BillingProductId.pack400]: {
    creditAmount: 400,
    envKey: 'STRIPE_PRICE_PACK_400',
    kind: 'payment',
  },
  [BillingProductId.pack1000]: {
    creditAmount: 1000,
    envKey: 'STRIPE_PRICE_PACK_1000',
    kind: 'payment',
  },
  [BillingProductId.hobby]: {
    creditAmount: 250,
    envKey: 'STRIPE_PRICE_HOBBY',
    kind: 'subscription',
    plan: 'hobby',
    storageLimitBytes: 250 * MEBIBYTE,
  },
  [BillingProductId.creator]: {
    creditAmount: 700,
    envKey: 'STRIPE_PRICE_CREATOR',
    kind: 'subscription',
    plan: 'creator',
    storageLimitBytes: 1024 * MEBIBYTE,
  },
  [BillingProductId.studio]: {
    creditAmount: 2000,
    envKey: 'STRIPE_PRICE_STUDIO',
    kind: 'subscription',
    plan: 'studio',
    storageLimitBytes: 5 * 1024 * MEBIBYTE,
  },
};

export const isBillingProductId = (value: string): value is BillingProductId =>
  Object.values(BillingProductId).includes(value as BillingProductId);

export const getStripePriceId = (productId: BillingProductId) =>
  process.env[BILLING_PRODUCTS[productId].envKey] ?? null;

export const isStripeProductConfigured = (productId: BillingProductId) =>
  Boolean(process.env.STRIPE_SECRET_KEY && getStripePriceId(productId));
