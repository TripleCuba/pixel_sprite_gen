import Typography from '../shared/Typography';
import styles from './LoadingIndicator.module.css';

type LoadingIndicatorProps = {
  description?: string;
  label: string;
  compact?: boolean;
  progress?: number;
};

const LoadingIndicator = ({ compact = false, description, label, progress }: LoadingIndicatorProps) => (
  <div className={compact ? styles.compact : styles.indicator} role="status" aria-live="polite">
    <Typography variant="span" className={styles.pixels} aria-hidden="true">
      <i />
      <i />
      <i />
    </Typography>
    <Typography variant="span" className={styles.copy}>
      <Typography variant="strong">{label}</Typography>
      {description ? <Typography variant="small">{description}</Typography> : null}
      {typeof progress === 'number' ? (
        <Typography variant="span" className={styles.progress} aria-label={`${Math.round(progress)}% complete`}>
          <Typography variant="span" style={{ width: `${Math.max(0, Math.min(progress, 100))}%` }} />
        </Typography>
      ) : null}
    </Typography>
  </div>
);

export default LoadingIndicator;
