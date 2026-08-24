"use client";

/* eslint-disable @next/next/no-img-element */

import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import styles from "./GeneratedSpritePreview.module.css";
import SpritePreviewDialog from "./SpritePreviewDialog";

type GeneratedSpritePreviewProps = {
  downloadUrl?: string;
  imageUrl: string;
  onClear: () => void;
};

const GeneratedSpritePreview = ({
  downloadUrl,
  imageUrl,
  onClear,
}: GeneratedSpritePreviewProps) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <section className={styles.preview} aria-label="Generated sprite preview">
      <h2 className={styles.label}>Generated sprite</h2>
      <button
        type="button"
        className={styles.canvas}
        aria-label="Open generated sprite preview"
        onClick={() => setIsPreviewOpen(true)}
      >
        <img
          src={imageUrl}
          alt="Generated pixel sprite"
          className={styles.image}
        />
      </button>
      <div className={styles.actions}>
        <a className={styles.action} href={downloadUrl ?? imageUrl} download="sprite.png">
          <Download aria-hidden="true" size={16} />
          Download
        </a>
        <button type="button" className={styles.clear} onClick={onClear}>
          <Trash2 aria-hidden="true" size={16} />
          Clear
        </button>
      </div>
      {isPreviewOpen ? (
        <SpritePreviewDialog
          imageUrl={imageUrl}
          onClose={() => setIsPreviewOpen(false)}
        />
      ) : null}
    </section>
  );
};

export default GeneratedSpritePreview;
