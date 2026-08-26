"use client";

import { useEffect, useState } from "react";
import styles from "./CreditBalance.module.css";

const CREDIT_CHANGE_EVENT = "sprite-credits-changed";

const CreditBalance = () => {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const loadBalance = async () => {
      try {
        const response = await fetch("/api/credits");
        const payload = (await response.json()) as {
          balance?: number;
          isUnlimited?: boolean;
        };

        if (response.ok && typeof payload.balance === "number") {
          setBalance(payload.isUnlimited ? Number.POSITIVE_INFINITY : payload.balance);
        }
      } catch {
        // The generator endpoint remains the authority for credit enforcement.
      }
    };

    void loadBalance();
    window.addEventListener(CREDIT_CHANGE_EVENT, loadBalance);

    return () => window.removeEventListener(CREDIT_CHANGE_EVENT, loadBalance);
  }, []);

  return (
    <span className={styles.balance} aria-live="polite">
      {balance === null
        ? "Credits..."
        : balance === Number.POSITIVE_INFINITY
          ? "Unlimited credits"
          : `${balance} credits`}
    </span>
  );
};

export { CREDIT_CHANGE_EVENT };
export default CreditBalance;
