"use client";

import { useId, type ChangeEvent } from "react";
import TextFieldControl from "./TextFieldControl";
import styles from "./TextField.module.css";
import type { TextFieldProps } from "./types";

const TextField = ({ label, value, onChange, ...controlProps }: TextFieldProps) => {
  const inputId = useId();

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onChange(event.target.value);
  };

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <TextFieldControl
        {...controlProps}
        inputId={inputId}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};

export default TextField;
