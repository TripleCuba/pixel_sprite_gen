import { getSupabaseAdmin, SpriteStorageError } from './sprite-storage';

export class StripeBillingError extends SpriteStorageError {}

const normaliseEmail = (email: string) => email.trim().toLowerCase();

export async function getStripeCustomerId(email: string) {
  const supabase = getSupabaseAdmin();
  const { data: user, error: userError } = await supabase
    .from('app_users')
    .select('id')
    .eq('email', normaliseEmail(email))
    .maybeSingle();

  if (userError) {
    console.error('Supabase Stripe customer user lookup failed:', userError);
    throw new StripeBillingError('Could not prepare Stripe Checkout.');
  }

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from('stripe_customers')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Supabase Stripe customer lookup failed:', error);
    throw new StripeBillingError('Could not prepare Stripe Checkout.');
  }

  return data?.stripe_customer_id ?? null;
}

type StripeCreditGrant = {
  creditAmount: number;
  customerId: string | null;
  eventId: string;
  kind: 'payment' | 'subscription';
  plan: 'creator' | 'hobby' | 'studio' | null;
  storageLimitBytes: number | null;
  subscriptionId: string | null;
  userEmail: string;
};

export async function grantStripeCredits(grant: StripeCreditGrant) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.rpc('grant_stripe_credits', {
    p_credit_amount: grant.creditAmount,
    p_customer_id: grant.customerId,
    p_event_id: grant.eventId,
    p_kind: grant.kind,
    p_plan: grant.plan,
    p_storage_limit_bytes: grant.storageLimitBytes,
    p_subscription_id: grant.subscriptionId,
    p_user_email: normaliseEmail(grant.userEmail),
  });

  if (error) {
    console.error('Supabase Stripe credit grant failed:', error);
    throw new StripeBillingError('Could not grant purchased credits.');
  }
}

type StripeSubscriptionUpdate = {
  customerId: string | null;
  hasAccess: boolean;
  plan: 'creator' | 'hobby' | 'studio';
  status: string;
  storageLimitBytes: number | null;
  subscriptionId: string;
  userEmail: string;
};

export async function syncStripeSubscription(update: StripeSubscriptionUpdate) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.rpc('sync_stripe_subscription', {
    p_customer_id: update.customerId,
    p_has_access: update.hasAccess,
    p_plan: update.plan,
    p_status: update.status,
    p_storage_limit_bytes: update.storageLimitBytes,
    p_subscription_id: update.subscriptionId,
    p_user_email: normaliseEmail(update.userEmail),
  });

  if (error) {
    console.error('Supabase Stripe subscription sync failed:', error);
    throw new StripeBillingError('Could not update the subscription.');
  }
}
