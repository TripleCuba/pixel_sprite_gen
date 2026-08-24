"use client";

import { useEffect, useState } from "react";
import {
  SPRITE_QUALITY_DETAILS,
  SpriteGenerationQuality,
  type SpriteGenerationQuality as SpriteGenerationQualityValue,
} from "@/lib/sprite-quality";
import { LoadingIndicator } from "../loading-indicator";
import styles from "./GenerationQuality.module.css";

type GenerationQualityProps = {
  disabled?: boolean;
  onChange: (quality: SpriteGenerationQualityValue) => void;
  refreshKey: number;
  value: SpriteGenerationQualityValue;
};

const qualityOptions = Object.values(SpriteGenerationQuality);

const GenerationQuality = ({
  disabled = false,
  onChange,
  refreshKey,
  value,
}: GenerationQualityProps) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadBalance = async () => {
      setError(null);

      try {
        const response = await fetch("/api/credits", { signal: controller.signal });
        const payload = (await response.json()) as {
          balance?: number;
          error?: string;
        };

        if (!response.ok || typeof payload.balance !== "number") {
          throw new Error(payload.error ?? "Could not load your credit balance.");
        }

        setBalance(payload.balance);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your credit balance.",
        );
      }
    };

    void loadBalance();

    return () => controller.abort();
  }, [refreshKey]);

  return (
    <fieldset className={styles.quality} disabled={disabled}>
      <legend>Generation Quality</legend>
      <div className={styles.balance}>
        {balance === null && !error ? (
          <LoadingIndicator compact label="Loading credits..." />
        ) : null}
        {balance !== null ? <strong>{balance} credits available</strong> : null}
        {error ? <span role="alert">{error}</span> : null}
      </div>
      <div className={styles.options}>
        {qualityOptions.map((quality) => {
          const details = SPRITE_QUALITY_DETAILS[quality];
          const isUnavailable = balance !== null && balance < details.creditCost;

          return (
            <label
              key={quality}
              className={`${styles.option} ${
                value === quality ? styles.optionSelected : ""
              } ${isUnavailable ? styles.optionUnavailable : ""}`}
            >
              <input
                type="radio"
                name="generation-quality"
                value={quality}
                checked={value === quality}
                disabled={isUnavailable}
                onChange={() => onChange(quality)}
              />
              <span className={styles.optionCopy}>
                <strong>{details.label}</strong>
                <small>{details.description}</small>
              </span>
              <b>{details.creditCost} cr</b>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
};

export default GenerationQuality;
