import React from 'react';
import styles from './TextField.module.css';

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const TextField: React.FC<TextFieldProps> = ({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `textfield-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;

  return (
    <div className={styles.container}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`${styles.input} ${hasError ? styles.error : ''} ${className}`}
        {...props}
      />
      {error && (
        <div className={styles.errorText}>
          {error}
        </div>
      )}
      {helperText && !error && (
        <div className={styles.helperText}>
          {helperText}
        </div>
      )}
    </div>
  );
};
