'use client';

import Typography from '../shared/Typography';

import { useEffect, useState } from 'react';
import {
  SPRITE_QUALITY_DETAILS,
  SpriteGenerationQuality,
  type SpriteGenerationQuality as SpriteGenerationQualityValue,
} from '@/lib/sprite-quality';
import { LoadingIndicator } from '../loading-indicator';
import styles from './GenerationQuality.module.css';

type GenerationQualityProps = {
  disabled?: boolean;
  onChange: (quality: SpriteGenerationQualityValue) => void;
  refreshKey: number;
  value: SpriteGenerationQualityValue;
};

const qualityOptions = Object.values(SpriteGenerationQuality);

const GenerationQuality = ({ disabled = false, onChange, refreshKey, value }: GenerationQualityProps) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadBalance = async () => {
      setError(null);

      try {
        const response = await fetch('/api/credits', {
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          balance?: number;
          error?: string;
          isUnlimited?: boolean;
        };

        if (!response.ok || typeof payload.balance !== 'number') {
          throw new Error(payload.error ?? 'Could not load your credit balance.');
        }

        setBalance(payload.balance);
        setIsUnlimited(payload.isUnlimited === true);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Could not load your credit balance.');
      }
    };

    void loadBalance();

    return () => controller.abort();
  }, [refreshKey]);

  return (
    <fieldset className={styles.quality} disabled={disabled}>
      <Typography variant="legend">Generation Quality</Typography>
      <div className={styles.balance}>
        {balance === null && !error ? <LoadingIndicator compact label="Loading credits..." /> : null}
        {balance !== null ? (
          <Typography variant="strong">{isUnlimited ? 'Unlimited credits' : `${balance} credits available`}</Typography>
        ) : null}
        {error ? (
          <Typography variant="span" role="alert">
            {error}
          </Typography>
        ) : null}
      </div>
      <div className={styles.options}>
        {qualityOptions.map((quality) => {
          const details = SPRITE_QUALITY_DETAILS[quality];
          const isUnavailable = !isUnlimited && balance !== null && balance < details.creditCost;

          return (
            <Typography
              variant="label"
              key={quality}
              className={`${styles.option} ${
                value === quality ? styles.optionSelected : ''
              } ${isUnavailable ? styles.optionUnavailable : ''}`}
            >
              <input
                type="radio"
                name="generation-quality"
                value={quality}
                checked={value === quality}
                disabled={isUnavailable}
                onChange={() => onChange(quality)}
              />
              <Typography variant="span" className={styles.optionCopy}>
                <Typography variant="strong">{details.label}</Typography>
                <Typography variant="small">{details.description}</Typography>
              </Typography>
              <Typography variant="b">{details.creditCost} credits</Typography>
            </Typography>
          );
        })}
      </div>
    </fieldset>
  );
};

export default GenerationQuality;
