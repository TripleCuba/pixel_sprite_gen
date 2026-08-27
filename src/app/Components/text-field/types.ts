export type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  rows?: number;
  type?: "email" | "password" | "search" | "text" | "url";
};
