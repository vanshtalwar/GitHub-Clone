import { useCallback, useState } from 'react';

/** A boolean preference remembered in localStorage. Best-effort: works (without remembering) if storage is blocked. */
export function useStoredBoolean(key: string, initial: boolean) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? initial : stored === 'true';
    } catch {
      return initial;
    }
  });

  const update = useCallback(
    (next: boolean) => {
      setValue(next);
      try {
        localStorage.setItem(key, String(next));
      } catch {
        // Storage unavailable: keep the value for this page view only.
      }
    },
    [key],
  );

  return [value, update] as const;
}
