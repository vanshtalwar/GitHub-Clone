import type { ReactNode } from 'react';
import styles from './Label.module.css';

/** Small outlined pill, e.g. "Public". */
export function Label({ children }: { children: ReactNode }) {
  return <span className={styles.label}>{children}</span>;
}
