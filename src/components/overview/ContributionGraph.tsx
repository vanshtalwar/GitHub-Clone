import { lazy, Suspense, useMemo } from 'react';
import { DOCS_URLS } from '../../config';
import { useElementWidth } from '../../hooks/useElementWidth';
import type { ContributionCalendar } from '../../types/github';
import { formatCount } from '../../utils/format';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { Skeleton } from '../common/Skeleton';
import { loadChart } from '../charts/loadChart';
import { buildCalendarOption, calendarLayout, fitPitch, MONTH_LABEL_HEIGHT, readCalendarColors } from './calendarOption';
import styles from './ContributionGraph.module.css';

const EChart = lazy(loadChart);

const PLACEHOLDER_HEIGHT = MONTH_LABEL_HEIGHT + 7 * 13;

/** The green calendar plus its footer. `busy` dims the current calendar while the next one loads. */
export function ContributionGraph({ calendar, busy = false }: { calendar: ContributionCalendar | null; busy?: boolean }) {
  const [scrollRef, width] = useElementWidth<HTMLDivElement>();
  // Resizing changes the width on every pixel but the cell size only every few dozen: everything below depends
  // on the cell size, so the chart is only rebuilt when it actually changes.
  const pitch = calendar ? fitPitch(calendar.from, calendar.to, width) : null;
  const layout = useMemo(() => (calendar && pitch ? calendarLayout(calendar.from, calendar.to, pitch) : null), [calendar, pitch]);
  const option = useMemo(
    () => (calendar && layout ? buildCalendarOption(calendar, layout, readCalendarColors()) : null),
    [calendar, layout],
  );
  const summary = calendar
    ? `Contribution graph: ${formatCount(calendar.total)} contributions from ${calendar.from} to ${calendar.to}`
    : undefined;

  return (
    <div className={styles.graph}>
      {/* Scrolls sideways when the calendar is wider than the box (phones), starting at the oldest week */}
      <div ref={scrollRef} className={`${styles.scroller} ${busy ? styles.busy : ''}`} aria-busy={busy || !calendar}>
        {option && layout ? (
          <ErrorBoundary fallback={<ChartUnavailable height={layout.height} />}>
            <Suspense fallback={<Skeleton height={layout.height} />}>
              <EChart option={option} ariaLabel={summary} className={styles.chart} style={{ width: layout.width, height: layout.height }} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          <Skeleton height={PLACEHOLDER_HEIGHT} />
        )}
      </div>
      <div className={styles.footer}>
        <a href={DOCS_URLS.contributions} className={styles.learnMore}>
          Learn how we count contributions
        </a>
        <div className={styles.legend} aria-hidden="true">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span key={level} className={styles.legendCell} style={{ background: `var(--color-calendar-l${level})` }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

/** Shown if the chart code can't be downloaded (offline, or a tab left open across a redeploy). */
function ChartUnavailable({ height }: { height: number }) {
  return (
    <div className={styles.unavailable} style={{ minHeight: height }} role="alert">
      The contribution graph couldn’t be displayed.{' '}
      <button type="button" className={styles.reload} onClick={() => window.location.reload()}>
        Reload
      </button>
    </div>
  );
}
