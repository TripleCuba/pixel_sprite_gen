import Image from "next/image";
import styles from "./Dropdown.module.css";
import type { DropdownOptionProps } from "./types";

const DropdownOption = <T extends string>({
  option,
  isActive,
  isSelected,
  icon,
  onMouseEnter,
  onSelect,
}: DropdownOptionProps<T>) => {
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      className={`${styles.option}${isActive ? ` ${styles.optionActive}` : ""}`}
      onMouseEnter={onMouseEnter}
      onClick={() => onSelect(option)}
    >
      <span className={styles.optionContent}>
        {icon && (
          <Image
            className={styles.icon}
            src={icon}
            alt=""
            aria-hidden="true"
            unoptimized
          />
        )}
        <span>{option}</span>
      </span>
    </button>
  );
};

export default DropdownOption;
