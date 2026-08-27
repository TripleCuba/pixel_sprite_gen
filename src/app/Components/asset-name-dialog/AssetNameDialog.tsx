"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const inputId = useId();
  const helpId = useId();

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    inputRef.current?.select();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSaving) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isSaving, onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={styles.dialog}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close rename asset dialog"
        disabled={isSaving}
        onClick={onClose}
      />
      <form
        className={styles.content}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={helpId}
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
          ref={inputRef}
          id={inputId}
          className={styles.input}
          value={title}
          maxLength={120}
          placeholder={spriteType}
          disabled={isSaving}
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
    </div>,
    document.body,
  );
};

export default AssetNameDialog;
