import { FoldIcon, GitPullRequestIcon, LockIcon, RepoPushIcon, UnfoldIcon, type Icon } from '@primer/octicons-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { githubUrl } from '../../../shared/github';
import { DOCS_URLS } from '../../config';
import type { ActivityItem, ActivityMonth, CommitActivity, PrivateActivity, PullRequestActivity } from '../../types/activity';
import type { ContributionPeriod } from '../../types/github';
import { pluralize } from '../../utils/format';
import { activityMonth, calendarMonth } from '../../utils/period';
import { Skeleton } from '../common/Skeleton';
import styles from './ContributionActivity.module.css';

/**
 * "Contribution activity" timeline, newest month first (live from GitHub's GraphQL API, or the design's sample data
 * for shreeramk). `months` is undefined while loading and null if it couldn't be loaded.
 */
export function ContributionActivity({
  months,
  period,
  login,
}: {
  months: ActivityMonth[] | null | undefined;
  period: ContributionPeriod;
  login: string;
}) {
  const [visibleMonths, setVisibleMonths] = useState(1);
  const monthHeadings = useRef<(HTMLHeadingElement | null)[]>([]);
  const revealed = useRef(false);

  // After "Show more activity", move focus to the month that appeared (the button may disappear).
  useEffect(() => {
    if (revealed.current) monthHeadings.current[visibleMonths - 1]?.focus();
  }, [visibleMonths]);

  if (!months || months.length === 0) {
    return (
      <section aria-labelledby="activity-heading" className={styles.section} aria-busy={months === undefined}>
        <h2 id="activity-heading" className={styles.heading}>
          Contribution activity
        </h2>
        {months === undefined && <Skeleton height={64} className={styles.loading} />}
        {months === null && <p className={styles.note}>Contribution activity couldn’t be loaded right now.</p>}
        {months?.length === 0 && <p className={styles.empty}>{login} has no activity yet for this period.</p>}
      </section>
    );
  }

  return (
    <section aria-labelledby="activity-heading" className={styles.section}>
      <h2 id="activity-heading" className={styles.heading}>
        Contribution activity
      </h2>

      {months.slice(0, visibleMonths).map((month, i) => {
        // Live months carry their own date; sample months are placed relative to the selected period
        const { month: name, year } = month.month ? calendarMonth(month.month) : activityMonth(period, month.monthsAgo);
        return (
          <div key={month.monthsAgo} className={styles.month}>
            <h3
              ref={(element) => {
                monthHeadings.current[i] = element;
              }}
              tabIndex={-1}
              className={styles.monthHeading}
            >
              <span className={styles.monthName}>{name}</span> <span className={styles.monthYear}>{year}</span>
            </h3>
            <ul className={styles.timeline}>
              {month.items.map((item) => (
                <ActivityEntry key={item.kind} item={item} />
              ))}
            </ul>
          </div>
        );
      })}

      {visibleMonths < months.length && (
        <button
          type="button"
          className={styles.showMore}
          onClick={() => {
            revealed.current = true;
            setVisibleMonths((count) => count + 1);
          }}
        >
          Show more activity
        </button>
      )}

      <p className={styles.note}>
        Seeing something unexpected? Take a look at the <a href={DOCS_URLS.profileGuide}>GitHub profile guide</a>.
      </p>
    </section>
  );
}

function ActivityEntry({ item }: { item: ActivityItem }) {
  if (item.kind === 'private') return <PrivateEntry item={item} />;
  if (item.kind === 'commits') {
    const total = item.repos.reduce((sum, repo) => sum + repo.count, 0);
    return (
      <TimelineItem
        icon={RepoPushIcon}
        title={`Created ${pluralize(total, 'commit')} in ${pluralize(item.repos.length, 'repository', 'repositories')}`}
        defaultOpen={false}
      >
        <CommitList item={item} />
      </TimelineItem>
    );
  }
  const total = item.repos.reduce((sum, repo) => sum + repo.merged + repo.open + repo.closed, 0);
  return (
    <TimelineItem
      icon={GitPullRequestIcon}
      title={`Opened ${pluralize(total, 'pull request')} in ${pluralize(item.repos.length, 'repository', 'repositories')}`}
      defaultOpen
    >
      <PullRequestList item={item} />
    </TimelineItem>
  );
}

/** "N contributions in private repositories": GitHub only reveals the count, so there's nothing to expand. */
function PrivateEntry({ item }: { item: PrivateActivity }) {
  return (
    <li className={styles.item}>
      <span className={styles.badge}>
        <LockIcon />
      </span>
      <div className={styles.itemBody}>
        <div className={styles.itemHeader}>
          <h4 className={styles.itemTitle}>{pluralize(item.count, 'contribution')} in private repositories</h4>
        </div>
      </div>
    </li>
  );
}

/** One timeline entry with a fold/unfold toggle for its details. */
function TimelineItem({
  icon: IconComponent,
  title,
  defaultOpen,
  children,
}: {
  icon: Icon;
  title: string;
  defaultOpen: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const detailsId = useId();

  return (
    <li className={styles.item}>
      <span className={styles.badge}>
        <IconComponent />
      </span>
      <div className={styles.itemBody}>
        <div className={styles.itemHeader}>
          <h4 className={styles.itemTitle}>{title}</h4>
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={open}
            aria-controls={detailsId}
            aria-label={`${title}: details`}
            onClick={() => setOpen((current) => !current)}
          >
            {open ? <FoldIcon /> : <UnfoldIcon />}
          </button>
        </div>
        <div id={detailsId} hidden={!open}>
          {children}
        </div>
      </div>
    </li>
  );
}

function CommitList({ item }: { item: CommitActivity }) {
  const max = Math.max(1, ...item.repos.map((repo) => repo.count));
  return (
    <ul className={styles.details}>
      {item.repos.map((repo) => (
        <li key={repo.name} className={styles.commitRow}>
          <a href={githubUrl(repo.name)} className={styles.repoLink}>
            {repo.name}
          </a>
          <a href={githubUrl(`${repo.name}/commits`)} className={styles.mutedLink}>
            {pluralize(repo.count, 'commit')}
          </a>
          <span className={styles.bar} aria-hidden="true">
            <span style={{ width: `${(repo.count / max) * 100}%` }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

function PullRequestList({ item }: { item: PullRequestActivity }) {
  return (
    <ul className={styles.details}>
      {item.repos.map((repo) => (
        <li key={repo.name} className={styles.prRow}>
          <a href={githubUrl(`${repo.name}/pulls`)} className={styles.prRepo}>
            {repo.name}
          </a>
          <span className={styles.states}>
            {repo.merged > 0 && (
              <span>
                <span className={`${styles.count} ${styles.merged}`}>{repo.merged}</span> merged
              </span>
            )}
            {repo.open > 0 && (
              <span>
                <span className={`${styles.count} ${styles.open}`}>{repo.open}</span> open
              </span>
            )}
            {repo.closed > 0 && (
              <span>
                <span className={`${styles.count} ${styles.closed}`}>{repo.closed}</span> closed
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
