'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import type { BillingProductId } from '@/lib/billing-products';
import Button from '../shared/Button';
import Typography from '../shared/Typography';

type CheckoutActionProps = {
  available: boolean;
  label: ReactNode;
  productId: BillingProductId;
};

const CheckoutAction = ({ available, label, productId }: CheckoutActionProps) => {
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
    <div style={{ marginTop: 'auto' }}>
      <Button
        disabled={!available || isLoading}
        label={isLoading ? 'Opening Checkout...' : available ? label : 'Coming soon'}
        onPress={startCheckout}
      />
      {error ? (
        <Typography variant="p" color="danger" lineHeight={1.4} margin="8px 0 0" role="alert" size="xs">
          {error}
        </Typography>
      ) : null}
    </div>
  );
};

export default CheckoutAction;
