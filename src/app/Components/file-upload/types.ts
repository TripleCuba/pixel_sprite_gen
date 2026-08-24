export type FileUploadAreaProps = {
  label: string;
  onFilesChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
};

export type SelectedFilesProps = {
  files: readonly File[];
  onRemove?: (file: File) => void;
};

export type SelectedFileCardProps = {
  file: File;
  onRemove?: (file: File) => void;
};

export type FilePreviewDialogProps = {
  fileName: string;
  previewUrl: string;
  onClose: () => void;
};
