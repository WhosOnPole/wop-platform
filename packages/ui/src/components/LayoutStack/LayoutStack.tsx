import React from 'react';
import styles from './LayoutStack.module.css';

export interface LayoutStackProps {
  children: React.ReactNode;
  className?: string;
  direction?: 'vertical' | 'horizontal';
  spacing?: 'small' | 'medium' | 'large';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
}

export const LayoutStack: React.FC<LayoutStackProps> = ({
  children,
  className = '',
  direction = 'vertical',
  spacing = 'medium',
  align = 'stretch',
  justify = 'start',
}) => {
  const classNames = [
    styles.stack,
    styles[direction],
    styles[`spacing-${spacing}`],
    styles[`align-${align}`],
    styles[`justify-${justify}`],
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      {children}
    </div>
  );
};
