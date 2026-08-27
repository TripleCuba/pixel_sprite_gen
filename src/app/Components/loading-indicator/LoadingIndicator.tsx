import styles from "./LoadingIndicator.module.css";

type LoadingIndicatorProps = {
  description?: string;
  label: string;
  compact?: boolean;
  progress?: number;
};

const LoadingIndicator = ({
  compact = false,
  description,
  label,
  progress,
}: LoadingIndicatorProps) => (
  <div
    className={compact ? styles.compact : styles.indicator}
    role="status"
    aria-live="polite"
  >
    <span className={styles.pixels} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
    <span className={styles.copy}>
      <strong>{label}</strong>
      {description ? <small>{description}</small> : null}
      {typeof progress === "number" ? (
        <span
          className={styles.progress}
          aria-label={`${Math.round(progress)}% complete`}
        >
          <span style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }} />
        </span>
      ) : null}
    </span>
  </div>
);

export default LoadingIndicator;
