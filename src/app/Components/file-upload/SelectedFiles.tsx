"use client";

import SelectedFileCard from "./SelectedFileCard";
import styles from "./FileUpload.module.css";
import type { SelectedFilesProps } from "./types";

const SelectedFiles = ({ files, onRemove }: SelectedFilesProps) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <section className={styles.selectedFiles} aria-label="Selected reference files">
      {files.map((file) => (
        <SelectedFileCard
          key={`${file.name}-${file.lastModified}`}
          file={file}
          onRemove={onRemove}
        />
      ))}
    </section>
  );
};

export default SelectedFiles;
