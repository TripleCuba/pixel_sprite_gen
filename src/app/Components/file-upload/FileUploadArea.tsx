"use client";

import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { Upload } from "lucide-react";
import styles from "./FileUpload.module.css";
import type { FileUploadAreaProps } from "./types";

const FileUploadArea = ({
  label,
  onFilesChange,
  accept = "image/*",
  multiple = true,
  maxFiles,
}: FileUploadAreaProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const updateFiles = (fileList: FileList | null) => {
    if (!fileList) {
      return;
    }

    const nextFiles = Array.from(fileList);
    const limit = multiple ? maxFiles : 1;
    onFilesChange(limit ? nextFiles.slice(0, limit) : nextFiles);
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    updateFiles(event.target.files);
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    updateFiles(event.dataTransfer.files);
  };

  return (
    <div className={styles.area}>
      <p id={`${inputId}-label`} className={styles.label}>
        {label}
      </p>
      <div
        className={`${styles.dropzone}${isDragging ? ` ${styles.dropzoneDragging}` : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          id={inputId}
          className={styles.input}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
        />
        <button
          type="button"
          className={styles.uploadButton}
          aria-labelledby={`${inputId}-label`}
          onClick={() => inputRef.current?.click()}
        >
          <span aria-hidden="true" className={styles.uploadIcon}>
            <Upload size={24} strokeWidth={2} />
          </span>
          Drop files here or <span className={styles.browse}>browse</span>
        </button>
      </div>
    </div>
  );
};

export default FileUploadArea;
