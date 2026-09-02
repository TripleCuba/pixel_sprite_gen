'use client';

import type { ReactNode } from 'react';
import { Modal } from '../modal';
import Button from './Button';
import type { ButtonVariant } from './Button';
import Typography from './Typography';
import styles from './Dialog.module.css';

type DialogAction = {
  disabled?: boolean;
  label: ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
};

type DialogProps = {
  ariaDescribedBy?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  body: ReactNode;
  bodyId?: string;
  bodyVariant?: 'content' | 'text';
  backdropLabel?: string;
  closeDisabled?: boolean;
  eyebrow?: ReactNode;
  header: ReactNode;
  headerId?: string;
  onClose: () => void;
  primaryButton: DialogAction;
  role?: 'dialog' | 'alertdialog';
  secondaryButton: DialogAction;
};

const Dialog = ({
  ariaDescribedBy,
  ariaLabel,
  ariaLabelledBy,
  body,
  bodyId,
  bodyVariant = 'text',
  backdropLabel,
  closeDisabled = false,
  eyebrow,
  header,
  headerId,
  onClose,
  primaryButton,
  role,
  secondaryButton,
}: DialogProps) => (
  <Modal
    ariaDescribedBy={ariaDescribedBy}
    ariaLabel={ariaLabel}
    ariaLabelledBy={ariaLabelledBy}
    backdropLabel={backdropLabel}
    closeDisabled={closeDisabled}
    contentClassName={styles.content}
    onClose={onClose}
    role={role}
  >
    {eyebrow ? (
      <Typography
        color='accent'
        lineHeight={1.6}
        margin='0 0 6px'
        size='small'
        transform='uppercase'
        variant='p'
      >
        {eyebrow}
      </Typography>
    ) : null}
    <Typography id={headerId} variant='h2'>
      {header}
    </Typography>
    {bodyVariant === 'text' ? (
      <Typography
        color='primary-light'
        id={bodyId}
        lineHeight={1.65}
        margin='14px 0 0'
        size='small'
        variant='p'
      >
        {body}
      </Typography>
    ) : (
      <div className={styles.bodyContent} id={bodyId}>
        {body}
      </div>
    )}
    <div className={styles.actions}>
      <Button
        disabled={secondaryButton.disabled}
        label={secondaryButton.label}
        onPress={secondaryButton.onPress}
        variant={secondaryButton.variant ?? 'secondary'}
      />
      <Button
        disabled={primaryButton.disabled}
        label={primaryButton.label}
        onPress={primaryButton.onPress}
        variant={primaryButton.variant ?? 'primary'}
      />
    </div>
  </Modal>
);

export default Dialog;
