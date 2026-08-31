'use client';

import Typography from '../shared/Typography';

import { useEffect, useState } from 'react';
import type { CreditActivity } from '@/lib/sprite-credits';
import { CREDIT_CHANGE_EVENT } from '../credit-balance/CreditBalance';
import { LoadingIndicator } from '../loading-indicator';
import styles from './CreditHistory.module.css';

const statusCopy = {
  completed: 'Completed',
  refunded: 'Refunded',
  reserved: 'Processing',
} as const;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const CreditHistory = () => {
  const [activity, setActivity] = useState<CreditActivity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadActivity = async () => {
      try {
        setError(null);
        const response = await fetch('/api/credits/history', {
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          activity?: CreditActivity[];
          error?: string;
        };

        if (!response.ok || !Array.isArray(payload.activity)) {
          throw new Error(payload.error ?? 'Could not load your credit activity.');
        }

        setActivity(payload.activity);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Could not load your credit activity.');
      }
    };

    void loadActivity();
    window.addEventListener(CREDIT_CHANGE_EVENT, loadActivity);

    return () => {
      controller.abort();
      window.removeEventListener(CREDIT_CHANGE_EVENT, loadActivity);
    };
  }, []);

  return (
    <section aria-labelledby="activity-heading" className={styles.section}>
      <div className={styles.heading}>
        <div>
          <Typography variant="p">ACCOUNT ACTIVITY</Typography>
          <Typography variant="h2" id="activity-heading">
            Generation credit history
          </Typography>
        </div>
        <Typography variant="span">Latest 20 events</Typography>
      </div>

      <div className={styles.panel}>
        {activity === null && !error ? <LoadingIndicator compact label="Loading activity..." /> : null}
        {error ? (
          <Typography
            variant="p"
            color="danger"
            lineHeight={1.45}
            margin={0}
            padding="10px 4px"
            role="alert"
            size="small"
          >
            {error}
          </Typography>
        ) : null}
        {activity?.length === 0 ? (
          <Typography variant="p" color="primary-light" lineHeight={1.45} margin={0} padding="10px 4px" size="small">
            Your completed and refunded generations will appear here.
          </Typography>
        ) : null}
        {activity?.length ? (
          <ul>
            {activity.map((entry) => (
              <li key={entry.id}>
                <div>
                  <Typography variant="strong">{entry.quality} quality sprite</Typography>
                  <Typography variant="span">{formatDate(entry.occurredAt)}</Typography>
                </div>
                <div className={styles.eventMeta}>
                  <Typography variant="span" className={`${styles.status} ${styles[entry.status]}`}>
                    {statusCopy[entry.status]}
                  </Typography>
                  <Typography variant="b">
                    {entry.status === 'refunded' ? '+' : '-'}
                    {entry.creditCost} credits
                  </Typography>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
};

export default CreditHistory;
