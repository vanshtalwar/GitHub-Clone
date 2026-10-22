import { TriangleDownIcon } from '@primer/octicons-react';
import { useEffect, useId, useRef, useState, type FocusEvent } from 'react';
import styles from './ContributionSettings.module.css';

/**
 * "Contribution settings ▾": a disclosure panel with two checkboxes. Escape and clicking outside close it
 * (Escape returns focus to the button); tabbing out of it closes it too.
 */
export function ContributionSettings({
  showOverview,
  onShowOverviewChange,
}: {
  showOverview: boolean;
  onShowOverviewChange: (show: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    wrapperRef.current?.querySelector<HTMLInputElement>('input:not([disabled])')?.focus();

    function onMouseDown(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function onBlur(event: FocusEvent) {
    if (open && !wrapperRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
  }

  return (
    <div ref={wrapperRef} className={styles.wrapper} onBlur={onBlur}>
      <button
        ref={buttonRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((current) => !current)}
      >
        Contribution settings <TriangleDownIcon />
      </button>
      {open && (
        <div id={panelId} role="group" aria-label="Contribution settings" className={styles.panel}>
          <label className={styles.option}>
            <input type="checkbox" checked readOnly disabled />
            <span>
              <span className={styles.optionTitle}>Private contributions</span>
              <span className={styles.description}>
                Turning on private contributions shows anonymized private activity on your profile. Only changeable on
                GitHub.
              </span>
            </span>
          </label>
          <label className={styles.option}>
            <input type="checkbox" checked={showOverview} onChange={(event) => onShowOverviewChange(event.target.checked)} />
            <span>
              <span className={styles.optionTitle}>Activity overview</span>
              <span className={styles.description}>
                Turning on the activity overview will show an overview of your activity across organizations and
                repositories.
              </span>
            </span>
          </label>
        </div>
      )}
    </div>
  );
}
