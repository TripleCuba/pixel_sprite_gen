"use client";

import Typography from "../shared/Typography";

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
        <Typography
          variant="p"
          color="accent"
          lineHeight={1.6}
          margin={0}
          size="small"
          transform="uppercase"
        >
          Saved asset
        </Typography>
        <Typography variant="h2" id={titleId}>
          Name this asset
        </Typography>
        <Typography
          variant="label"
          color="foreground"
          display="block"
          htmlFor={inputId}
          margin="0 0 7px"
          size="small"
        >
          Asset title
        </Typography>
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
          <Typography
            variant="p"
            color="primary-light"
            id={helpId}
            lineHeight={1.6}
            margin="8px 0 0"
            size="small"
          >
            Leave it empty to use “{spriteType}” instead.
          </Typography>
          <Typography
            variant="p"
            aria-live="polite"
            color="accent"
            margin="8px 0 0"
            size="xs"
          >
            {title.length}/120
          </Typography>
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
