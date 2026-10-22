import type { Repo } from '../../types/github';
import { formatUpdated, formatVisibility } from '../../utils/format';
import { Label } from '../common/Label';
import { ForkedFrom, RepoStats } from './RepoParts';
import styles from './RepoListItem.module.css';

/** One row of the Repositories / Stars tab lists. `showOwner` prefixes the owner, as GitHub does for stars. */
export function RepoListItem({ repo, showOwner = false }: { repo: Repo; showOwner?: boolean }) {
  const [owner, name] = repo.fullName.split('/');

  return (
    <li className={styles.item}>
      <h3 className={styles.title}>
        {/* The label keeps the name identical in every browser ("owner/name"); the visual spacing varies otherwise. */}
        <a href={repo.htmlUrl} className={styles.name} aria-label={showOwner ? repo.fullName : undefined}>
          {showOwner && <span className={styles.owner}>{owner} / </span>}
          {name}
        </a>
        <Label>{formatVisibility(repo.visibility)}</Label>
      </h3>
      <ForkedFrom repo={repo} className={styles.forked} />
      {repo.description && <p className={styles.description}>{repo.description}</p>}
      <RepoStats repo={repo}>
        <span>{formatUpdated(repo.updatedAt)}</span>
      </RepoStats>
    </li>
  );
}
