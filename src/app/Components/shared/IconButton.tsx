'use client';

import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import type { ButtonSizeToken, ButtonVariantToken } from './tokens';
import { iconSizeTokens } from './tokens';
import styles from './Button.module.css';

export type IconButtonSize = ButtonSizeToken;
export type IconButtonVariant = ButtonVariantToken;

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick'> & {
  icon: ReactNode;
  label?: ReactNode;
  onPress?: MouseEventHandler<HTMLButtonElement>;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
};

const IconButton = ({
  disabled = false,
  className,
  icon,
  label,
  onPress,
  size = 'medium',
  type = 'button',
  variant = 'primary',
  ...props
}: IconButtonProps) => {
  const iconSize = iconSizeTokens[size];

  return (
    <button
      {...props}
      className={[styles.root, className].filter(Boolean).join(' ')}
      data-size={size}
      data-variant={variant}
      disabled={disabled}
      type={type}
      onClick={onPress}
    >
      {icon && (
        <span aria-hidden="true" style={{ marginRight: label ? '0.5em' : 0, display: 'flex' }}>
          {icon}
        </span>
      )}
      {label}
    </button>
  );
};

export default IconButton;
