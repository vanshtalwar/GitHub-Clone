import { RepoForkedIcon, StarIcon } from '@primer/octicons-react';
import type { ReactNode } from 'react';
import { githubUrl } from '../../../shared/github';
import type { Repo } from '../../types/github';
import { formatCount } from '../../utils/format';
import { LanguageDot } from '../common/LanguageDot';
import styles from './RepoParts.module.css';

// Pieces shared by the Popular repositories cards and the Repositories / Stars lists.

/** "Forked from owner/repo", if the repo is a fork with a known parent. */
export function ForkedFrom({ repo, className = '' }: { repo: Repo; className?: string }) {
  if (!repo.parentFullName) return null;
  return (
    <p className={`${styles.forked} ${className}`}>
      Forked from <a href={githubUrl(repo.parentFullName)}>{repo.parentFullName}</a>
    </p>
  );
}

/** Language dot, stars and forks (each only when there is something to show), plus optional extra items. */
export function RepoStats({ repo, className = '', children }: { repo: Repo; className?: string; children?: ReactNode }) {
  const hasStats = repo.language || repo.stargazersCount > 0 || repo.forksCount > 0;
  if (!hasStats && !children) return null;
  return (
    <div className={`${styles.stats} ${className}`}>
      {repo.language && <LanguageDot language={repo.language} />}
      {repo.stargazersCount > 0 && (
        <a href={`${repo.htmlUrl}/stargazers`} className={styles.statLink} aria-label={`${repo.stargazersCount} stars`}>
          <StarIcon size={16} /> {formatCount(repo.stargazersCount)}
        </a>
      )}
      {repo.forksCount > 0 && (
        <a href={`${repo.htmlUrl}/forks`} className={styles.statLink} aria-label={`${repo.forksCount} forks`}>
          <RepoForkedIcon size={16} /> {formatCount(repo.forksCount)}
        </a>
      )}
      {children}
    </div>
  );
}
