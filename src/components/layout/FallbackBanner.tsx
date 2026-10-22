import { AlertIcon, XIcon } from '@primer/octicons-react';
import { useState } from 'react';
import { describeLoadFailure, type LoadFailure } from '../../api/failure';
import styles from './FallbackBanner.module.css';

/** Tells the viewer that some sections show sample data, and why. Dismissible for the current page view. */
export function FallbackBanner({ failure, className = '' }: { failure: LoadFailure; className?: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div role="status" className={`${styles.banner} ${className}`}>
      <AlertIcon className={styles.icon} />
      <p className={styles.text}>
        <strong>Showing sample data for some sections.</strong> {describeLoadFailure(failure)}
      </p>
      <button type="button" className={styles.close} aria-label="Dismiss" onClick={() => setDismissed(true)}>
        <XIcon />
      </button>
    </div>
  );
}
