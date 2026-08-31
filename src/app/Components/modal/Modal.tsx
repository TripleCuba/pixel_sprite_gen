'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

type ModalProps = {
  ariaDescribedBy?: string;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  backdropLabel?: string;
  children: React.ReactNode;
  closeDisabled?: boolean;
  contentClassName?: string;
  onClose: () => void;
  role?: 'dialog' | 'alertdialog';
};

const getFocusableElements = (container: HTMLElement) =>
  Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );

const Modal = ({
  ariaDescribedBy,
  ariaLabel,
  ariaLabelledBy,
  backdropLabel = 'Close dialog',
  children,
  closeDisabled = false,
  contentClassName,
  onClose,
  role = 'dialog',
}: ModalProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusable = contentRef.current ? getFocusableElements(contentRef.current) : [];
    focusable[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !closeDisabled) {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !contentRef.current) {
        return;
      }

      const currentFocusable = getFocusableElements(contentRef.current);
      const firstElement = currentFocusable[0];
      const lastElement = currentFocusable.at(-1);

      if (!firstElement || !lastElement) {
        event.preventDefault();
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [closeDisabled, onClose]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className={styles.modal}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label={backdropLabel}
        disabled={closeDisabled}
        onClick={onClose}
      />
      <div
        ref={contentRef}
        className={`${styles.content}${contentClassName ? ` ${contentClassName}` : ''}`}
        role={role}
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
