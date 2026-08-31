import Typography from '../shared/Typography';
import Image from 'next/image';
import styles from './Dropdown.module.css';
import type { DropdownOptionProps } from './types';

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
      className={`${styles.option}${isActive ? ` ${styles.optionActive}` : ''}`}
      role="option"
      aria-selected={isSelected}
      onMouseEnter={onMouseEnter}
      onClick={() => onSelect(option)}
    >
      <Typography variant="span" className={styles.optionContent}>
        {icon && <Image className={styles.icon} src={icon} alt="" aria-hidden="true" unoptimized />}
        <Typography variant="span">{option}</Typography>
      </Typography>
    </button>
  );
};

export default DropdownOption;
