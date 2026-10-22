import type { Icon } from '@primer/octicons-react';
import type { ReactNode } from 'react';
import styles from './Blankslate.module.css';

/** GitHub's bordered empty-state box: icon, title, explanation. */
export function Blankslate({ icon: IconComponent, title, children }: { icon: Icon; title: string; children?: ReactNode }) {
  return (
    <div className={styles.blankslate}>
      <IconComponent size={24} className={styles.icon} />
      <h3 className={styles.title}>{title}</h3>
      {children && <div className={styles.body}>{children}</div>}
    </div>
  );
}
