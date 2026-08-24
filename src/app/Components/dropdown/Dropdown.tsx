"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import DropdownOption from "./DropdownOption";
import styles from "./Dropdown.module.css";
import type { DropdownProps } from "./types";

const Dropdown = <T extends string>({
  label,
  value,
  onChange,
  options,
  icons,
}: DropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(
    Math.max(options.indexOf(value), 0),
  );
  const dropdownRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const menuId = useId();

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const selectOption = (option: T) => {
    onChange(option);
    setActiveIndex(options.indexOf(option));
    setIsOpen(false);
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const currentIndex = isOpen
        ? activeIndex
        : Math.max(options.indexOf(value), 0);
      setIsOpen(true);
      setActiveIndex(
        event.key === "ArrowDown"
          ? Math.min(currentIndex + 1, options.length - 1)
          : Math.max(currentIndex - 1, 0),
      );
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen((open) => !open);
    }
  };

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <p id={labelId} className={styles.label}>
        {label}
      </p>
      <button
        type="button"
        className={styles.trigger}
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => {
          setActiveIndex(Math.max(options.indexOf(value), 0));
          setIsOpen((open) => !open);
        }}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={styles.value}>
          {icons?.[value] && (
            <Image
              className={styles.icon}
              src={icons[value]}
              alt=""
              aria-hidden="true"
              unoptimized
            />
          )}
          <span>{value}</span>
        </span>
        <span
          className={`${styles.chevron}${isOpen ? ` ${styles.chevronOpen}` : ""}`}
        />
      </button>
      {isOpen && (
        <div
          id={menuId}
          className={styles.menu}
          role="listbox"
          aria-labelledby={labelId}
        >
          {options.map((option, index) => (
            <DropdownOption
              key={option}
              option={option}
              isActive={index === activeIndex}
              isSelected={option === value}
              icon={icons?.[option]}
              onMouseEnter={() => setActiveIndex(index)}
              onSelect={selectOption}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
