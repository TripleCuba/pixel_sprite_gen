import Stripe from 'stripe';

export class StripeConfigurationError extends Error {}

export const getStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new StripeConfigurationError('Stripe is not configured.');
  }

  return new Stripe(secretKey);
};
