"use client";

import { useId } from "react";
import { Modal } from "../modal";
import styles from "./AlertDialog.module.css";

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
  cancelLabel = "Cancel",
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
      <h2 id={titleId}>{title}</h2>
      <p id={descriptionId}>{description}</p>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancel}
          disabled={isConfirming}
          onClick={onClose}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={styles.confirm}
          disabled={isConfirming}
          onClick={onConfirm}
        >
          {isConfirming ? "Deleting..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

export default AlertDialog;
