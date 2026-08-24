import { TopBar } from "../Components/top-bar";
import { CreditHistory } from "../Components/credit-history";
import { CheckoutButton } from "../Components/checkout-button";
import { BillingProductId, isStripeProductConfigured } from "@/lib/billing-products";
import styles from "./page.module.css";
import { auth } from "@/auth";
import { isEmailAllowed } from "@/lib/allowed-emails";
import { isAuthConfigured } from "@/lib/auth-config";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const creditPacks = [
  { credits: 100, price: "$4.99", note: "For occasional projects", id: BillingProductId.pack100 },
  { credits: 400, price: "$14.99", note: "Best value for regular creation", featured: true, id: BillingProductId.pack400 },
  { credits: 1000, price: "$29.99", note: "For larger asset batches", id: BillingProductId.pack1000 },
];

const subscriptions = [
  { name: "Hobby", price: "$9", credits: 250, storage: "250 MB storage", id: BillingProductId.hobby },
  {
    name: "Creator",
    price: "$19",
    credits: 700,
    storage: "1 GB storage",
    featured: true,
    id: BillingProductId.creator,
  },
  { name: "Studio", price: "$49", credits: 2000, storage: "5 GB storage", id: BillingProductId.studio },
];

export default async function BillingPage() {
  if (!isAuthConfigured()) {
    redirect("/");
  }

  const session = await auth();

  if (!session?.user || !isEmailAllowed(session.user.email)) {
    redirect("/");
  }

  return (
    <div className={styles.page}>
      <TopBar isAuthConfigured user={session.user} />
      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>SPRITESMITH PLANS</p>
          <h1>More sprites, on your terms.</h1>
          <p>
            Use credits for every generation. Subscriptions replenish your balance
            monthly, while credit packs are there whenever a project needs more.
          </p>
          <div className={styles.notice} role="status">
            Payments are completed securely in Stripe Checkout. Credits are added after payment is confirmed.
          </div>
        </section>

        <section aria-labelledby="quality-heading" className={styles.qualitySection}>
          <div>
            <p className={styles.eyebrow}>CREDIT COST</p>
            <h2 id="quality-heading">Choose the detail you need.</h2>
          </div>
          <div className={styles.qualityCosts}>
            <div><strong>Draft</strong><span>1 credit</span></div>
            <div><strong>Standard</strong><span>4 credits</span></div>
            <div><strong>High</strong><span>16 credits</span></div>
          </div>
        </section>

        <section aria-labelledby="packs-heading">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>FLEXIBLE USE</p>
              <h2 id="packs-heading">Credit packs</h2>
            </div>
            <p>Purchased credits do not expire.</p>
          </div>
          <div className={styles.grid}>
            {creditPacks.map((pack) => (
              <article className={`${styles.card} ${pack.featured ? styles.featured : ""}`} key={pack.credits}>
                {pack.featured ? <span className={styles.badge}>POPULAR</span> : null}
                <h3>{pack.credits} credits</h3>
                <p className={styles.price}>{pack.price}</p>
                <p>{pack.note}</p>
                <CheckoutButton available={isStripeProductConfigured(pack.id)} productId={pack.id}>
                  Buy credits
                </CheckoutButton>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="plans-heading">
          <div className={styles.sectionHeading}>
            <div>
              <p className={styles.eyebrow}>MONTHLY PLANS</p>
              <h2 id="plans-heading">Keep your creative flow moving.</h2>
            </div>
            <p>Unused monthly credits roll over for one month.</p>
          </div>
          <div className={styles.grid}>
            {subscriptions.map((plan) => (
              <article className={`${styles.card} ${plan.featured ? styles.featured : ""}`} key={plan.name}>
                {plan.featured ? <span className={styles.badge}>RECOMMENDED</span> : null}
                <h3>{plan.name}</h3>
                <p className={styles.price}>{plan.price}<small>/month</small></p>
                <ul>
                  <li>{plan.credits.toLocaleString()} credits each month</li>
                  <li>{plan.storage}</li>
                  <li>Credit-pack top-ups available</li>
                </ul>
                <CheckoutButton available={isStripeProductConfigured(plan.id)} productId={plan.id}>
                  Choose {plan.name}
                </CheckoutButton>
              </article>
            ))}
          </div>
        </section>
        <CreditHistory />
      </main>
    </div>
  );
}
