/* Local file previews are client-side data URLs and are not Next image assets. */
/* eslint-disable @next/next/no-img-element */

import { X } from 'lucide-react';
import styles from './FileUpload.module.css';
import type { FilePreviewDialogProps } from './types';

const FilePreviewDialog = ({ fileName, previewUrl, onClose }: FilePreviewDialogProps) => {
  return (
    <div className={styles.previewDialog} role="dialog" aria-modal="true">
      <button type="button" className={styles.previewBackdrop} aria-label="Close preview" onClick={onClose} />
      <div className={styles.previewContent}>
        <img src={previewUrl} alt={fileName} />
        <button type="button" className={styles.previewClose} aria-label="Close preview" onClick={onClose}>
          <X aria-hidden="true" size={20} />
        </button>
      </div>
    </div>
  );
};

export default FilePreviewDialog;
