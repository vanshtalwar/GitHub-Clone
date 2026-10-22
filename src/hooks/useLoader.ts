import { useEffect, useEffectEvent, useState } from 'react';

export interface LoaderResult<T> {
  /** The result for the current key; undefined while it loads. */
  value: T | undefined;
  /** The most recent result for any key, so a caller can keep showing it while the next key loads. */
  last: { key: string; value: T } | undefined;
}

/**
 * Runs `load` whenever `key` changes and keeps the result. Results that arrive for an outdated key are ignored,
 * so fast switches (user, year) never show the wrong data. `load` must not reject: loaders turn failures into
 * values (e.g. a "notFound" or "error" state).
 */
export function useLoader<T>(key: string, load: () => Promise<T>): LoaderResult<T> {
  const [result, setResult] = useState<{ key: string; value: T }>();
  // Always the latest `load`, without making it an effect dependency (it's a new function every render).
  const run = useEffectEvent(load);

  useEffect(() => {
    let active = true;
    void run().then((value) => {
      if (active) setResult({ key, value });
    });
    return () => {
      active = false;
    };
  }, [key]);

  return { value: result?.key === key ? result.value : undefined, last: result };
}
