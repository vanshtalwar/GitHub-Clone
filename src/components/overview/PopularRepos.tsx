import { DOCS_URLS, POPULAR_REPO_COUNT } from '../../config';
import { useProfile } from '../../hooks/useProfile';
import { selectPopularRepos } from '../../utils/repos';
import { Skeleton } from '../common/Skeleton';
import { RepoCard } from './RepoCard';
import styles from './PopularRepos.module.css';

/** "Popular repositories": the user's top repos (live), or the screenshot's (sample-data fallback). */
export function PopularRepos() {
  const profile = useProfile();
  const repos = profile.status === 'ready' ? selectPopularRepos(profile.repos) : null;

  return (
    <section aria-labelledby="popular-repos-heading" className={styles.section}>
      <div className={styles.header}>
        <h2 id="popular-repos-heading" className={styles.title}>
          Popular repositories
        </h2>
        <a href={DOCS_URLS.pinnedItems} className={styles.customize}>
          Customize your pins
        </a>
      </div>

      {repos === null && (
        <ol className={styles.grid} aria-busy="true" aria-label="Loading repositories">
          {Array.from({ length: POPULAR_REPO_COUNT }, (_, i) => (
            <li key={i}>
              <Skeleton height={112} />
            </li>
          ))}
        </ol>
      )}
      {repos?.length === 0 && <p className={styles.empty}>No public repositories yet.</p>}
      {repos && repos.length > 0 && (
        <ol className={styles.grid}>
          {repos.map((repo) => (
            <li key={repo.fullName}>
              <RepoCard repo={repo} />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
