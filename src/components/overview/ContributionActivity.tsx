import { FoldIcon, GitPullRequestIcon, RepoPushIcon, UnfoldIcon, type Icon } from '@primer/octicons-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { githubUrl } from '../../../shared/github';
import { DOCS_URLS } from '../../config';
import type { ActivityItem, ActivityMonth, CommitActivity, PullRequestActivity } from '../../types/activity';
import type { ContributionPeriod } from '../../types/github';
import { pluralize } from '../../utils/format';
import { activityMonth } from '../../utils/period';
import styles from './ContributionActivity.module.css';

/**
 * "Contribution activity" timeline. No public API provides it (the Events API no longer carries commit counts or
 * PR merge state, and private contributions aren't public), so `months` comes from the profile's sample data and
 * is null for users without it. Months are counted back from the selected period.
 */
export function ContributionActivity({ months, period }: { months: ActivityMonth[] | null; period: ContributionPeriod }) {
  const [visibleMonths, setVisibleMonths] = useState(1);
  const monthHeadings = useRef<(HTMLHeadingElement | null)[]>([]);
  const revealed = useRef(false);

  // After "Show more activity", move focus to the month that appeared (the button may disappear).
  useEffect(() => {
    if (revealed.current) monthHeadings.current[visibleMonths - 1]?.focus();
  }, [visibleMonths]);

  if (!months) {
    return (
      <section aria-labelledby="activity-heading" className={styles.section}>
        <h2 id="activity-heading" className={styles.heading}>
          Contribution activity
        </h2>
        <p className={styles.note}>Activity details aren’t available here: GitHub’s public API doesn’t include them.</p>
      </section>
    );
  }


  return (
    <section aria-labelledby="activity-heading" className={styles.section}>
      <h2 id="activity-heading" className={styles.heading}>
        Contribution activity
      </h2>

      {months.slice(0, visibleMonths).map((month, i) => {
        const { month: name, year } = activityMonth(period, month.monthsAgo);
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
  const total = item.repos.reduce((sum, repo) => sum + repo.merged + repo.open, 0);
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
          </span>
        </li>
      ))}
    </ul>
  );
}
