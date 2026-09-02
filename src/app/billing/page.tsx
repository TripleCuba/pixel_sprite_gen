import Typography from '../Components/shared/Typography';
import { TopBar } from '../Components/top-bar';
import { CreditHistory } from '../Components/credit-history';
import { CheckoutAction } from '../Components/checkout-action';
import { BillingProductId, isStripeProductConfigured } from '@/lib/billing-products';
import styles from './page.module.css';
import { auth } from '@/auth';
import { isEmailAllowed } from '@/lib/allowed-emails';
import { isAuthConfigured } from '@/lib/auth-config';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const creditPacks = [
  {
    credits: 100,
    price: '$4.99',
    note: 'For occasional projects',
    id: BillingProductId.pack100,
  },
  {
    credits: 400,
    price: '$14.99',
    note: 'Best value for regular creation',
    featured: true,
    id: BillingProductId.pack400,
  },
  {
    credits: 1000,
    price: '$29.99',
    note: 'For larger asset batches',
    id: BillingProductId.pack1000,
  },
];

const subscriptions = [
  {
    name: 'Hobby',
    price: '$9',
    credits: 250,
    storage: '250 MB storage',
    id: BillingProductId.hobby,
  },
  {
    name: 'Creator',
    price: '$19',
    credits: 700,
    storage: '1 GB storage',
    featured: true,
    id: BillingProductId.creator,
  },
  {
    name: 'Studio',
    price: '$49',
    credits: 2000,
    storage: '5 GB storage',
    id: BillingProductId.studio,
  },
];

export default async function BillingPage() {
  if (!isAuthConfigured()) {
    redirect('/');
  }

  const session = await auth();

  if (!session?.user || !isEmailAllowed(session.user.email)) {
    redirect('/');
  }

  return (
    <div className={styles.page}>
      <TopBar isAuthConfigured user={session.user} />
      <main className={styles.main}>
        <section className={styles.hero}>
          <Typography variant="p" className={styles.eyebrow}>
            SPRITESMITH PLANS
          </Typography>
          <Typography variant="h1">More sprites, on your terms.</Typography>
          <Typography variant="p">
            Use credits for every generation. Subscriptions replenish your balance monthly, while credit packs are there
            whenever a project needs more.
          </Typography>
          <div className={styles.notice} role="status">
            Payments are completed securely in Stripe Checkout. Credits are added after payment is confirmed.
          </div>
        </section>

        <section aria-labelledby="quality-heading" className={styles.qualitySection}>
          <div>
            <Typography variant="p" className={styles.eyebrow}>
              CREDIT COST
            </Typography>
            <Typography variant="h2" id="quality-heading">
              Choose the detail you need.
            </Typography>
          </div>
          <div className={styles.qualityCosts}>
            <div>
              <Typography variant="strong">Draft</Typography>
              <Typography variant="span">1 credit</Typography>
            </div>
            <div>
              <Typography variant="strong">Standard</Typography>
              <Typography variant="span">4 credits</Typography>
            </div>
            <div>
              <Typography variant="strong">High</Typography>
              <Typography variant="span">16 credits</Typography>
            </div>
          </div>
        </section>

        <section aria-labelledby="packs-heading">
          <div className={styles.sectionHeading}>
            <div>
              <Typography variant="p" className={styles.eyebrow}>
                FLEXIBLE USE
              </Typography>
              <Typography variant="h2" id="packs-heading">
                Credit packs
              </Typography>
            </div>
            <Typography variant="p">Purchased credits do not expire.</Typography>
          </div>
          <div className={styles.grid}>
            {creditPacks.map((pack) => (
              <article className={`${styles.card} ${pack.featured ? styles.featured : ''}`} key={pack.credits}>
                {pack.featured ? (
                  <Typography variant="span" className={styles.badge}>
                    POPULAR
                  </Typography>
                ) : null}
                <Typography variant="h3">{pack.credits} credits</Typography>
                <Typography variant="p" className={styles.price}>
                  {pack.price}
                </Typography>
                <Typography variant="p">{pack.note}</Typography>
                <CheckoutAction
                  available={isStripeProductConfigured(pack.id)}
                  label="Buy credits"
                  productId={pack.id}
                />
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="plans-heading">
          <div className={styles.sectionHeading}>
            <div>
              <Typography variant="p" className={styles.eyebrow}>
                MONTHLY PLANS
              </Typography>
              <Typography variant="h2" id="plans-heading">
                Keep your creative flow moving.
              </Typography>
            </div>
            <Typography variant="p">Unused monthly credits roll over for one month.</Typography>
          </div>
          <div className={styles.grid}>
            {subscriptions.map((plan) => (
              <article className={`${styles.card} ${plan.featured ? styles.featured : ''}`} key={plan.name}>
                {plan.featured ? (
                  <Typography variant="span" className={styles.badge}>
                    RECOMMENDED
                  </Typography>
                ) : null}
                <Typography variant="h3">{plan.name}</Typography>
                <Typography variant="p" className={styles.price}>
                  {plan.price}
                  <Typography variant="small">/month</Typography>
                </Typography>
                <ul>
                  <li>{plan.credits.toLocaleString()} credits each month</li>
                  <li>{plan.storage}</li>
                  <li>Credit-pack top-ups available</li>
                </ul>
                <CheckoutAction
                  available={isStripeProductConfigured(plan.id)}
                  label={`Choose ${plan.name}`}
                  productId={plan.id}
                />
              </article>
            ))}
          </div>
        </section>
        <CreditHistory />
      </main>
    </div>
  );
}
