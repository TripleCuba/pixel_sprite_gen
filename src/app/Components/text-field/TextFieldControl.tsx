import type { ChangeEvent } from "react";
import styles from "./TextField.module.css";
import type { TextFieldProps } from "./types";

type TextFieldControlProps = Omit<TextFieldProps, "label" | "onChange"> & {
  inputId: string;
  onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
};

const TextFieldControl = ({
  inputId,
  value,
  onChange,
  placeholder,
  multiline = false,
  maxLength,
  rows = 4,
  type = "text",
}: TextFieldControlProps) => {
  if (multiline) {
    return (
      <textarea
        id={inputId}
        className={styles.input}
        rows={rows}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={onChange}
      />
    );
  }

  return (
    <input
      id={inputId}
      className={styles.input}
      type={type}
      value={value}
      placeholder={placeholder}
      maxLength={maxLength}
      onChange={onChange}
    />
  );
};

export default TextFieldControl;
