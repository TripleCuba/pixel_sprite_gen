"use client";

import { useId, useState } from "react";
import { Modal } from "../modal";
import styles from "./AssetNameDialog.module.css";

type AssetNameDialogProps = {
  initialTitle: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
  spriteType: string;
};

const AssetNameDialog = ({
  initialTitle,
  isSaving,
  onClose,
  onSave,
  spriteType,
}: AssetNameDialogProps) => {
  const [title, setTitle] = useState(initialTitle);
  const titleId = useId();
  const inputId = useId();
  const helpId = useId();

  return (
    <Modal
      ariaDescribedBy={helpId}
      ariaLabelledBy={titleId}
      backdropLabel="Close rename asset dialog"
      closeDisabled={isSaving}
      contentClassName={styles.content}
      onClose={onClose}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(title);
        }}
      >
        <p className={styles.eyebrow}>Saved asset</p>
        <h2 id={titleId}>Name this asset</h2>
        <label className={styles.label} htmlFor={inputId}>
          Asset title
        </label>
        <input
          id={inputId}
          className={styles.input}
          value={title}
          maxLength={120}
          placeholder={spriteType}
          disabled={isSaving}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => setTitle(event.target.value)}
        />
        <div className={styles.helpRow}>
          <p id={helpId} className={styles.help}>
            Leave it empty to use “{spriteType}” instead.
          </p>
          <p className={styles.counter} aria-live="polite">
            {title.length}/120
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancel}
            disabled={isSaving}
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="submit" className={styles.save} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save name"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssetNameDialog;
