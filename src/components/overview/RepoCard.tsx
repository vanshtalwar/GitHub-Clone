import type { Repo } from '../../types/github';
import { formatVisibility } from '../../utils/format';
import { Label } from '../common/Label';
import { ForkedFrom, RepoStats } from '../repos/RepoParts';
import styles from './RepoCard.module.css';

/** One pinned/popular repository card. */
export function RepoCard({ repo }: { repo: Repo }) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <a href={repo.htmlUrl} className={styles.name} title={repo.name}>
          {repo.name}
        </a>
        <Label>{formatVisibility(repo.visibility)}</Label>
      </div>
      <ForkedFrom repo={repo} className={styles.forked} />
      <p className={styles.description}>{repo.description}</p>
      <RepoStats repo={repo} className={styles.stats} />
    </div>
  );
}
