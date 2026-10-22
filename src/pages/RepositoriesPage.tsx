import { useState } from 'react';
import { githubUrl } from '../../shared/github';
import { RepoListItem } from '../components/repos/RepoListItem';
import { useProfile } from '../hooks/useProfile';
import type { Repo } from '../types/github';
import { formatCount } from '../utils/format';
import styles from './TabPage.module.css';

export function RepositoriesPage() {
  const profile = useProfile();
  const [query, setQuery] = useState('');

  return (
    <section aria-labelledby="repositories-heading">
      <h2 id="repositories-heading" className="sr-only">
        Repositories
      </h2>
      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.filter}
          placeholder="Find a repository…"
          aria-label="Find a repository"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {profile.status === 'ready' ? (
        <>
          <RepoList repos={profile.repos} login={profile.user.login} query={query} />
          {/* Only the first page (most recently updated) is loaded, to save the visitor's 60 calls per hour */}
          {profile.user.publicRepos > profile.repos.length && (
            <p className={styles.more}>
              Showing the {profile.repos.length} most recently updated of {formatCount(profile.user.publicRepos)}{' '}
              repositories. <a href={githubUrl(`${profile.user.login}?tab=repositories`)}>View all on GitHub</a>
            </p>
          )}
        </>
      ) : (
        <p className={styles.status}>Loading repositories…</p>
      )}
    </section>
  );
}

function RepoList({ repos, login, query }: { repos: Repo[]; login: string; query: string }) {
  const needle = query.trim().toLowerCase();
  const visible = repos
    .filter((repo) => repo.name.toLowerCase().includes(needle))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); // GitHub's default: last updated first

  if (visible.length === 0) {
    return (
      <p className={styles.status}>
        {needle ? `${login} doesn’t have any repositories that match.` : `${login} doesn’t have any public repositories yet.`}
      </p>
    );
  }
  return (
    <ul>
      {visible.map((repo) => (
        <RepoListItem key={repo.fullName} repo={repo} />
      ))}
    </ul>
  );
}
