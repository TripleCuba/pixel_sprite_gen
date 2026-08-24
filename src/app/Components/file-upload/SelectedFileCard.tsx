"use client";

/* Local file previews are client-side data URLs and are not Next image assets. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { FileImage, X } from "lucide-react";
import FilePreviewDialog from "./FilePreviewDialog";
import styles from "./FileUpload.module.css";
import type { SelectedFileCardProps } from "./types";
import { formatFileSize } from "./utils";

const SelectedFileCard = ({ file, onRemove }: SelectedFileCardProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const isImage = file.type.startsWith("image/");

  useEffect(() => {
    if (!isImage) {
      return;
    }

    const reader = new FileReader();
    const handleLoad = () => {
      if (typeof reader.result === "string") {
        setPreviewUrl(reader.result);
      }
    };

    reader.addEventListener("load", handleLoad);
    reader.readAsDataURL(file);

    return () => {
      reader.removeEventListener("load", handleLoad);
      reader.abort();
    };
  }, [file, isImage]);

  return (
    <>
      <article className={styles.selectedFileCard}>
        <button
          type="button"
          className={styles.selectedFilePreview}
          disabled={!previewUrl}
          aria-label={`Preview ${file.name}`}
          onClick={() => setIsPreviewOpen(true)}
        >
          {previewUrl ? (
            <img src={previewUrl} alt="" />
          ) : (
            <FileImage aria-hidden="true" size={28} />
          )}
        </button>
        <div className={styles.selectedFileDetails}>
          <p title={file.name}>{file.name}</p>
          <span>{formatFileSize(file.size)}</span>
        </div>
        {onRemove && (
          <button
            type="button"
            className={styles.selectedFileRemove}
            aria-label={`Remove ${file.name}`}
            onClick={() => onRemove(file)}
          >
            <X aria-hidden="true" size={16} />
          </button>
        )}
      </article>
      {isPreviewOpen && previewUrl && (
        <FilePreviewDialog
          fileName={file.name}
          previewUrl={previewUrl}
          onClose={() => setIsPreviewOpen(false)}
        />
      )}
    </>
  );
};

export default SelectedFileCard;
