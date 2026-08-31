'use client';

import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEventHandler, ReactNode } from 'react';
import type { ButtonSizeToken, ButtonVariantToken } from './tokens';
import styles from './Button.module.css';

export type ButtonSize = ButtonSizeToken;
export type ButtonVariant = ButtonVariantToken;

type BaseButtonProps = {
  icon?: ReactNode;
  label: ReactNode;
  size?: ButtonSize;
  variant?: ButtonVariant;
};

type ButtonAsButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick'> &
  BaseButtonProps & {
    onPress?: MouseEventHandler<HTMLButtonElement>;
  };

type ButtonAsLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children'> &
  BaseButtonProps & {
    download?: string | boolean;
    href: string;
  };

type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const isLinkProps = (props: ButtonProps): props is ButtonAsLinkProps => {
  return 'href' in props && props.href !== undefined;
};

const Button = (props: ButtonProps) => {
  const { className, icon, label, size = 'medium', variant = 'primary', ...rest } = props;
  const classNames = [styles.root, className].filter(Boolean).join(' ');

  if (isLinkProps(props)) {
    const { href, download, ...linkProps } = rest as Omit<ButtonAsLinkProps, keyof BaseButtonProps>;
    return (
      <a {...linkProps} href={href} className={classNames} data-size={size} data-variant={variant} download={download}>
        {icon && (
          <span aria-hidden="true" style={{ marginRight: '0.5em' }}>
            {icon}
          </span>
        )}
        {label}
      </a>
    );
  }

  const {
    disabled = false,
    onPress,
    type = 'button',
    ...buttonProps
  } = rest as Omit<ButtonAsButtonProps, keyof BaseButtonProps>;

  return (
    <button
      {...buttonProps}
      className={classNames}
      data-size={size}
      data-variant={variant}
      disabled={disabled}
      type={type}
      onClick={onPress}
    >
      {icon && (
        <span aria-hidden="true" style={{ marginRight: '0.5em' }}>
          {icon}
        </span>
      )}
      {label}
    </button>
  );
};

export default Button;
