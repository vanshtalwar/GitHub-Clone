import { RepoIcon } from '@primer/octicons-react';
import { Fragment } from 'react';
import { githubUrl } from '../../../shared/github';
import type { ActivityOverview as ActivityOverviewData } from '../../types/activity';
import { pluralize } from '../../utils/format';
import { ActivityCrossChart } from './ActivityCrossChart';
import styles from './ActivityOverview.module.css';

/** The panel under the graph: the user's organizations, "Contributed to …", and the cross chart. Sample data. */
export function ActivityOverview({ overview }: { overview: ActivityOverviewData }) {
  return (
    <div className={styles.overview}>
      {/* On GitHub these chips filter the overview by organization; without per-organization data they link to the orgs */}
      <ul className={styles.orgs} aria-label="Organizations">
        {overview.orgs.map((org) => (
          <li key={org.login}>
            <a href={githubUrl(org.login)} className={styles.org}>
              <img src={org.avatarUrl} alt="" width={20} height={20} />@{org.login}
            </a>
          </li>
        ))}
      </ul>

      <div className={styles.columns}>
        <div className={styles.summary}>
          <h3 className={styles.title}>Activity overview</h3>
          <p className={styles.contributed}>
            <RepoIcon className={styles.icon} />
            <span>
              Contributed to{' '}
              {overview.contributedTo.map((repo, i) => (
                <Fragment key={repo}>
                  {i > 0 && ', '}
                  <a href={githubUrl(repo)} className={styles.repo}>
                    {repo}
                  </a>
                </Fragment>
              ))}
              {overview.otherRepoCount > 0 && ` and ${pluralize(overview.otherRepoCount, 'other repository', 'other repositories')}`}
            </span>
          </p>
        </div>
        <div className={styles.chart}>
          <ActivityCrossChart breakdown={overview.breakdown} />
        </div>
      </div>
    </div>
  );
}
