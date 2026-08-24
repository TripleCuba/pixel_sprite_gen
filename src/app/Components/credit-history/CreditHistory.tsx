"use client";

import { useEffect, useState } from "react";
import type { CreditActivity } from "@/lib/sprite-credits";
import { CREDIT_CHANGE_EVENT } from "../credit-balance/CreditBalance";
import { LoadingIndicator } from "../loading-indicator";
import styles from "./CreditHistory.module.css";

const statusCopy = {
  completed: "Completed",
  refunded: "Refunded",
  reserved: "Processing",
} as const;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const CreditHistory = () => {
  const [activity, setActivity] = useState<CreditActivity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadActivity = async () => {
      try {
        setError(null);
        const response = await fetch("/api/credits/history", {
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          activity?: CreditActivity[];
          error?: string;
        };

        if (!response.ok || !Array.isArray(payload.activity)) {
          throw new Error(payload.error ?? "Could not load your credit activity.");
        }

        setActivity(payload.activity);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your credit activity.",
        );
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
          <p>ACCOUNT ACTIVITY</p>
          <h2 id="activity-heading">Generation credit history</h2>
        </div>
        <span>Latest 20 events</span>
      </div>

      <div className={styles.panel}>
        {activity === null && !error ? (
          <LoadingIndicator compact label="Loading activity..." />
        ) : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {activity?.length === 0 ? (
          <p className={styles.empty}>
            Your completed and refunded generations will appear here.
          </p>
        ) : null}
        {activity?.length ? (
          <ul>
            {activity.map((entry) => (
              <li key={entry.id}>
                <div>
                  <strong>{entry.quality} quality sprite</strong>
                  <span>{formatDate(entry.occurredAt)}</span>
                </div>
                <div className={styles.eventMeta}>
                  <span className={`${styles.status} ${styles[entry.status]}`}>
                    {statusCopy[entry.status]}
                  </span>
                  <b>
                    {entry.status === "refunded" ? "+" : "-"}
                    {entry.creditCost} credits
                  </b>
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
