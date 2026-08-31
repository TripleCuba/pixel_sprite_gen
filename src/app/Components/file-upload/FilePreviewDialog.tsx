/* Local file previews are client-side data URLs and are not Next image assets. */
/* eslint-disable @next/next/no-img-element */

import { X } from 'lucide-react';
import { iconSizeTokens } from '../shared/tokens';
import IconButton from '../shared/IconButton';
import styles from './FileUpload.module.css';
import type { FilePreviewDialogProps } from './types';

const FilePreviewDialog = ({ fileName, previewUrl, onClose }: FilePreviewDialogProps) => {
  return (
    <div className={styles.previewDialog} role="dialog" aria-modal="true">
      <div className={styles.previewContent}>
        <img src={previewUrl} alt={fileName} />
        <IconButton
          aria-label="Close preview"
          icon={<X aria-hidden="true" size={iconSizeTokens.large} />}
          onPress={onClose}
          size="large"
          variant="unstyled"
        />
      </div>
    </div>
  );
};

export default FilePreviewDialog;
