'use client';

import Button from '../shared/Button';
import Typography from '../shared/Typography';

import { useId } from 'react';
import { Modal } from '../modal';
import styles from './AlertDialog.module.css';

type AlertDialogProps = {
  cancelLabel?: string;
  confirmLabel: string;
  description: string;
  isConfirming?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
};

const AlertDialog = ({
  cancelLabel = 'Cancel',
  confirmLabel,
  description,
  isConfirming = false,
  onClose,
  onConfirm,
  title,
}: AlertDialogProps) => {
  const descriptionId = useId();
  const titleId = useId();

  return (
    <Modal
      ariaDescribedBy={descriptionId}
      ariaLabelledBy={titleId}
      closeDisabled={isConfirming}
      contentClassName={styles.content}
      onClose={onClose}
      role="alertdialog"
    >
      <Typography variant="h2" id={titleId}>
        {title}
      </Typography>
      <Typography variant="p" id={descriptionId}>
        {description}
      </Typography>
      <div className={styles.actions}>
        <Button variant="secondary" label={cancelLabel} onPress={onClose} disabled={isConfirming} />
        <Button
          variant="danger"
          label={isConfirming ? 'Deleting...' : confirmLabel}
          onPress={onConfirm}
          disabled={isConfirming}
        />
      </div>
    </Modal>
  );
};

export default AlertDialog;
