export type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  type?: "email" | "password" | "search" | "text" | "url";
};
