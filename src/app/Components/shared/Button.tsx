'use client';

import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import type { ButtonSizeToken, ButtonVariantToken } from './tokens';
import styles from './Button.module.css';

export type ButtonSize = ButtonSizeToken;
export type ButtonVariant = ButtonVariantToken;

type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick'> & {
  label: ReactNode;
  onPress?: MouseEventHandler<HTMLButtonElement>;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

const Button = ({
  disabled = false,
  className,
  label,
  onPress,
  size = 'medium',
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) => (
  <button
    {...props}
    className={[styles.root, className].filter(Boolean).join(' ')}
    data-size={size}
    data-variant={variant}
    disabled={disabled}
    type={type}
    onClick={onPress}
  >
    {label}
  </button>
);

export default Button;
