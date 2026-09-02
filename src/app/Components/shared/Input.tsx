import type { InputHTMLAttributes, ReactNode } from 'react';
import styles from './Input.module.css';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  helpText?: ReactNode;
  helpTextId?: string;
  showCounter?: boolean;
};

const Input = ({
  className,
  helpText,
  helpTextId,
  maxLength,
  showCounter = typeof maxLength === 'number',
  value,
  ...props
}: InputProps) => {
  const classNames = [styles.root, className].filter(Boolean).join(' ');
  const currentLength = typeof value === 'string' ? value.length : Array.isArray(value) ? value.length : 0;

  return (
    <div className={styles.wrapper}>
      <input {...props} className={classNames} maxLength={maxLength} value={value} />
      {helpText || (showCounter && typeof maxLength === 'number') ? (
        <div className={styles.helpRow}>
          {helpText ? (
            <span id={helpTextId} className={styles.helpText}>
              {helpText}
            </span>
          ) : null}
          {showCounter && typeof maxLength === 'number' ? (
            <span aria-live="polite" className={styles.counter}>
              {currentLength}/{maxLength}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default Input;
