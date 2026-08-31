'use client';

import Typography from '../shared/Typography';

import { useState } from 'react';
import type { ReactNode } from 'react';
import type { BillingProductId } from '@/lib/billing-products';
import styles from './CheckoutButton.module.css';

type CheckoutButtonProps = {
  available: boolean;
  children: ReactNode;
  productId: BillingProductId;
};

const CheckoutButton = ({ available, children, productId }: CheckoutButtonProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startCheckout = async () => {
    if (!available || isLoading) {
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/billing/checkout', {
        body: JSON.stringify({ productId }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });
      const payload = (await response.json()) as {
        error?: string;
        url?: string;
      };

      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? 'Could not start Stripe Checkout.');
      }

      window.location.assign(payload.url);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Could not start Stripe Checkout.');
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.root}>
      <button disabled={!available || isLoading} onClick={startCheckout} type="button">
        {isLoading ? 'Opening Checkout...' : available ? children : 'Coming soon'}
      </button>
      {error ? (
        <Typography variant="p" color="danger" lineHeight={1.4} margin="8px 0 0" role="alert" size="xs">
          {error}
        </Typography>
      ) : null}
    </div>
  );
};

export default CheckoutButton;
