import type { CSSProperties } from 'react';
import styles from './Skeleton.module.css';

/** Grey placeholder block shown while data loads. Purely visual; the container should set aria-busy. */
export function Skeleton({
  width = '100%',
  height = 16,
  circle = false,
  className = '',
  style,
}: {
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  circle?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      aria-hidden="true"
      className={`${styles.skeleton} ${circle ? styles.circle : ''} ${className}`}
      style={{ width, height, ...style }}
    />
  );
}
