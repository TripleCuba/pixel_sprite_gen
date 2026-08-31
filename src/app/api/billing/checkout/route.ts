import { auth } from '@/auth';
import { isEmailAllowed } from '@/lib/allowed-emails';
import { BILLING_PRODUCTS, getStripePriceId, isBillingProductId } from '@/lib/billing-products';
import { isAuthConfigured } from '@/lib/auth-config';
import { getStripeCustomerId, StripeBillingError } from '@/lib/stripe-billing';
import { getStripe, StripeConfigurationError } from '@/lib/stripe';

const errorResponse = (message: string, status: number) => Response.json({ error: message }, { status });

export async function POST(request: Request) {
  if (!isAuthConfigured()) {
    return errorResponse('Authentication is not configured.', 503);
  }

  const session = await auth();

  if (!session?.user?.email) {
    return errorResponse('Sign in with Google before checking out.', 401);
  }

  if (!isEmailAllowed(session.user.email)) {
    return errorResponse('This account is not approved to check out.', 403);
  }

  let productId: unknown;
  try {
    ({ productId } = (await request.json()) as { productId?: unknown });
  } catch {
    return errorResponse('Select a valid billing option.', 400);
  }

  if (typeof productId !== 'string' || !isBillingProductId(productId)) {
    return errorResponse('Select a valid billing option.', 400);
  }

  const product = BILLING_PRODUCTS[productId];
  const priceId = getStripePriceId(productId);

  if (!priceId) {
    return errorResponse('This billing option is not available yet.', 503);
  }

  try {
    const customerId = await getStripeCustomerId(session.user.email);
    const stripe = getStripe();
    const origin = new URL(request.url).origin;
    const metadata = {
      billing_product: productId,
      user_email: session.user.email,
    };
    const checkout = await stripe.checkout.sessions.create({
      ...(customerId ? { customer: customerId } : { customer_email: session.user.email }),
      ...(product.kind === 'payment' ? { customer_creation: 'always' } : {}),
      cancel_url: `${origin}/billing`,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      mode: product.kind,
      payment_method_types: ['card'],
      subscription_data: product.kind === 'subscription' ? { metadata } : undefined,
      success_url: `${origin}/billing?checkout=success`,
    });

    if (!checkout.url) {
      return errorResponse('Could not create Stripe Checkout.', 502);
    }

    return Response.json({ url: checkout.url });
  } catch (error) {
    if (error instanceof StripeConfigurationError || error instanceof StripeBillingError) {
      return errorResponse(error.message, 503);
    }

    console.error('Stripe Checkout session creation failed:', error);
    return errorResponse('Could not create Stripe Checkout. Please try again later.', 502);
  }
}
