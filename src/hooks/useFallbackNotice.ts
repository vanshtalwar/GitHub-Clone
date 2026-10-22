import { createContext, useContext, useEffect } from 'react';
import type { LoadFailure } from '../api/failure';

type ReportFallback = (key: string, failure: LoadFailure | null) => void;

/** Provided by ProfileLayout, which shows the "sample data" banner for every section that reports a fallback. */
export const FallbackNoticeContext = createContext<ReportFallback>(() => {});

/** Reports that `key`'s section is showing sample data (failure) or live data (null). Cleared on unmount. */
export function useFallbackNotice(key: string, failure: LoadFailure | null) {
  const report = useContext(FallbackNoticeContext);
  useEffect(() => {
    report(key, failure);
    return () => report(key, null);
  }, [report, key, failure]);
}
