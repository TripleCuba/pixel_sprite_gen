"use client";

import Typography from "../shared/Typography";

import { useId, type ChangeEvent } from "react";
import TextFieldControl from "./TextFieldControl";
import styles from "./TextField.module.css";
import type { TextFieldProps } from "./types";

const TextField = ({
  label,
  value,
  onChange,
  ...controlProps
}: TextFieldProps) => {
  const inputId = useId();

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    onChange(event.target.value);
  };

  return (
    <div className={styles.field}>
      <Typography variant="label" color="foreground" htmlFor={inputId}>
        {label}
      </Typography>
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
