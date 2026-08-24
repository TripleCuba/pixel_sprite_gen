import Stripe from "stripe";
import {
  BILLING_PRODUCTS,
  isBillingProductId,
  type BillingProductId,
} from "@/lib/billing-products";
import { grantStripeCredits, syncStripeSubscription } from "@/lib/stripe-billing";
import { getStripe, StripeConfigurationError } from "@/lib/stripe";

export const runtime = "nodejs";

const getId = (value: string | { id: string } | null) =>
  typeof value === "string" ? value : value?.id ?? null;

const getProductId = (metadata: Stripe.Metadata | null | undefined) => {
  const productId = metadata?.billing_product;
  return productId && isBillingProductId(productId) ? productId : null;
};

const getUserEmail = (metadata: Stripe.Metadata | null | undefined) =>
  metadata?.user_email ?? null;

const grantProductCredits = async ({
  customerId,
  eventId,
  productId,
  subscriptionId,
  userEmail,
}: {
  customerId: string | null;
  eventId: string;
  productId: BillingProductId;
  subscriptionId: string | null;
  userEmail: string;
}) => {
  const product = BILLING_PRODUCTS[productId];

  await grantStripeCredits({
    creditAmount: product.creditAmount,
    customerId,
    eventId,
    kind: product.kind,
    plan: product.plan ?? null,
    storageLimitBytes: product.storageLimitBytes ?? null,
    subscriptionId,
    userEmail,
  });
};

const syncSubscription = async (subscription: Stripe.Subscription) => {
  const productId = getProductId(subscription.metadata);
  const userEmail = getUserEmail(subscription.metadata);

  if (!productId || !userEmail) {
    return;
  }

  const product = BILLING_PRODUCTS[productId];
  if (product.kind !== "subscription") {
    return;
  }

  const hasAccess = subscription.status === "active" || subscription.status === "trialing";
  await syncStripeSubscription({
    customerId: getId(subscription.customer),
    hasAccess,
    plan: product.plan!,
    status: subscription.status,
    storageLimitBytes: product.storageLimitBytes ?? null,
    subscriptionId: subscription.id,
    userEmail,
  });
};

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return new Response("Webhook signature is missing.", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      webhookSecret,
    );
  } catch (error) {
    if (error instanceof StripeConfigurationError) {
      return new Response("Stripe is not configured.", { status: 503 });
    }

    return new Response("Invalid webhook signature.", { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const checkout = event.data.object as Stripe.Checkout.Session;
      const productId = getProductId(checkout.metadata);
      const userEmail = getUserEmail(checkout.metadata);

      if (checkout.payment_status === "paid" && productId && userEmail) {
        await grantProductCredits({
          customerId: getId(checkout.customer),
          eventId: event.id,
          productId,
          subscriptionId: getId(checkout.subscription),
          userEmail,
        });
      }
    }

    if (event.type === "invoice.paid") {
      const invoice = event.data.object as Stripe.Invoice;
      const details = invoice.parent?.subscription_details;
      const productId = getProductId(details?.metadata);
      const userEmail = getUserEmail(details?.metadata);

      if (
        invoice.billing_reason === "subscription_cycle" &&
        productId &&
        userEmail
      ) {
        await grantProductCredits({
          customerId: getId(invoice.customer),
          eventId: event.id,
          productId,
          subscriptionId: getId(details?.subscription ?? null),
          userEmail,
        });
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await syncSubscription(event.data.object as Stripe.Subscription);
    }
  } catch (error) {
    console.error("Stripe webhook processing failed:", error);
    return new Response("Webhook processing failed.", { status: 500 });
  }

  return Response.json({ received: true });
}
