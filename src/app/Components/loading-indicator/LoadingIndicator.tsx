import styles from "./LoadingIndicator.module.css";

type LoadingIndicatorProps = {
  description?: string;
  label: string;
  compact?: boolean;
};

const LoadingIndicator = ({
  compact = false,
  description,
  label,
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
    </span>
  </div>
);

export default LoadingIndicator;
