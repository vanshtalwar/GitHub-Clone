import { useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { STORAGE_PREFIX } from '../../config';
import { useContributions, type ReadyContributions } from '../../hooks/useContributions';
import { useFallbackNotice } from '../../hooks/useFallbackNotice';
import { useProfile } from '../../hooks/useProfile';
import { useStoredBoolean } from '../../hooks/useStoredBoolean';
import { pluralize } from '../../utils/format';
import { currentYear, describePeriod, parsePeriod, profileYears } from '../../utils/period';
import { preloadChart } from '../charts/loadChart';
import { Skeleton } from '../common/Skeleton';
import { ActivityOverview } from './ActivityOverview';
import { ContributionActivity } from './ContributionActivity';
import { ContributionGraph } from './ContributionGraph';
import { ContributionSettings } from './ContributionSettings';
import { YearList } from './YearList';
import styles from './ContributionsSection.module.css';

const SHOW_OVERVIEW_KEY = `${STORAGE_PREFIX}show-activity-overview`;

/**
 * The contributions area (requirement 3a): heading + settings, the calendar box, the activity panels and the
 * year list. The period comes from ?year= so it survives reloads and back/forward.
 */
export function ContributionsSection({ username }: { username: string }) {
  const profile = useProfile();
  const [searchParams] = useSearchParams();
  const thisYear = currentYear();
  const period = parsePeriod(searchParams.get('year'), thisYear);
  const years = profile.status === 'ready' ? profileYears(profile.user.createdAt, thisYear) : [];
  const activity = profile.status === 'ready' ? (profile.extras?.activity ?? null) : null;
  const [showOverview, setShowOverview] = useStoredBoolean(SHOW_OVERVIEW_KEY, true);

  // Download the chart code while the calendar data loads, rather than after it.
  useEffect(preloadChart, []);

  const state = useContributions(username, period);
  const shown: ReadyContributions | undefined =
    state.status === 'ready' ? state : state.status === 'loading' ? state.previous : undefined;
  // Pass the state's own failure object: a new object each render would re-report on every render.
  useFallbackNotice(`contributions:${username}`, shown?.source === 'mock' ? (shown.failure ?? null) : null);

  // Describes the calendar on screen, so while another period loads the heading still matches the (dimmed) graph.
  const heading = shown ? `${pluralize(shown.calendar.total, 'contribution')} in ${describePeriod(shown.period)}` : null;

  return (
    <section aria-labelledby="contributions-heading" className={styles.section}>
      <div className={styles.main}>
        <div className={styles.headingRow}>
          <h2 id="contributions-heading" className={styles.heading} aria-busy={state.status === 'loading'}>
            {heading ?? (state.status === 'loading' ? <Skeleton width={260} height={20} /> : 'Contributions')}
          </h2>
          <ContributionSettings showOverview={showOverview} onShowOverviewChange={setShowOverview} />
        </div>
        <div className={styles.box}>
          {state.status === 'error' || state.status === 'notFound' ? (
            <p className={styles.unavailable}>Contribution data couldn’t be loaded right now.</p>
          ) : (
            <ContributionGraph calendar={shown?.calendar ?? null} busy={state.status === 'loading' && !!shown} />
          )}
          {showOverview && activity && <ActivityOverview overview={activity.overview} />}
        </div>
        {/* Keyed by period, so "Show more activity" starts over when the year changes */}
        <ContributionActivity key={String(period)} months={activity?.months ?? null} period={period} />
      </div>
      <YearList years={years} period={period} className={styles.years} />
    </section>
  );
}
