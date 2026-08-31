import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Sparkles } from 'lucide-react';
import styles from './GenerateButton.module.css';

type GenerateButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

const GenerateButton = ({ children, ...props }: GenerateButtonProps) => {
  return (
    <button type="button" className={styles.button} {...props}>
      <Sparkles aria-hidden="true" size={20} />
      {children}
    </button>
  );
};

export default GenerateButton;
