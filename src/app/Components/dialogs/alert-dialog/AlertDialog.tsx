'use client';

import Dialog from '../../shared/Dialog';

import { useId } from 'react';

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
    <Dialog
      ariaDescribedBy={descriptionId}
      ariaLabelledBy={titleId}
      body={description}
      bodyId={descriptionId}
      closeDisabled={isConfirming}
      header={title}
      headerId={titleId}
      onClose={onClose}
      role="alertdialog"
      primaryButton={{
        disabled: isConfirming,
        label: isConfirming ? 'Deleting...' : confirmLabel,
        onPress: onConfirm,
        variant: 'danger',
      }}
      secondaryButton={{
        disabled: isConfirming,
        label: cancelLabel,
        onPress: onClose,
      }}
    />
  );
};

export default AlertDialog;
