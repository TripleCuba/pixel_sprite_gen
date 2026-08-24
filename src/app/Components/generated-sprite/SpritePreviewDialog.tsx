/* eslint-disable @next/next/no-img-element */

import { X } from "lucide-react";
import styles from "./GeneratedSpritePreview.module.css";

type SpritePreviewDialogProps = {
  imageUrl: string;
  onClose: () => void;
};

const SpritePreviewDialog = ({ imageUrl, onClose }: SpritePreviewDialogProps) => (
  <div className={styles.dialog} role="dialog" aria-modal="true" aria-label="Sprite preview">
    <button
      type="button"
      className={styles.backdrop}
      aria-label="Close preview"
      onClick={onClose}
    />
    <div className={styles.dialogContent}>
      <img src={imageUrl} alt="Generated pixel sprite" className={styles.dialogImage} />
      <button
        type="button"
        className={styles.close}
        aria-label="Close preview"
        onClick={onClose}
      >
        <X aria-hidden="true" size={20} />
      </button>
    </div>
  </div>
);

export default SpritePreviewDialog;
