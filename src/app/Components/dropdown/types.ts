import type { StaticImageData } from 'next/image';

export type DropdownProps<T extends string> = {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly T[];
  icons?: Partial<Record<T, StaticImageData>>;
};

export type DropdownOptionProps<T extends string> = {
  option: T;
  isActive: boolean;
  isSelected: boolean;
  icon?: StaticImageData;
  onMouseEnter: () => void;
  onSelect: (option: T) => void;
};
