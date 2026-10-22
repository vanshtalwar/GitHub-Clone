import { CloudOfflineIcon, StarIcon } from '@primer/octicons-react';
import { githubUrl } from '../../shared/github';
import { describeLoadFailure } from '../api/failure';
import { Blankslate } from '../components/common/Blankslate';
import { RepoListItem } from '../components/repos/RepoListItem';
import { useProfile } from '../hooks/useProfile';
import { useStarred } from '../hooks/useStarred';
import { useUsername } from '../hooks/useUsername';
import { formatCount } from '../utils/format';
import styles from './TabPage.module.css';

export function StarsPage() {
  const username = useUsername();
  const profile = useProfile();
  const starred = useStarred(username);
  const total = profile.status === 'ready' ? profile.starredCount : undefined;

  return (
    <section aria-labelledby="stars-heading">
      <h2 id="stars-heading" className="sr-only">
        Stars
      </h2>
      {starred.status === 'loading' && <p className={styles.status}>Loading starred repositories…</p>}
      {starred.status === 'error' && (
        <Blankslate icon={CloudOfflineIcon} title="Couldn’t load starred repositories">
          <p>{describeLoadFailure(starred.failure)}</p>
        </Blankslate>
      )}
      {starred.status === 'ready' &&
        (starred.repos.length > 0 ? (
          <>
            <ul>
              {starred.repos.map((repo) => (
                <RepoListItem key={repo.fullName} repo={repo} showOwner />
              ))}
            </ul>
            {total !== undefined && total > starred.repos.length && (
              <p className={styles.more}>
                Showing the {starred.repos.length} most recently starred of {formatCount(total)}.{' '}
                <a href={githubUrl(`${username}?tab=stars`)}>View all on GitHub</a>
              </p>
            )}
          </>
        ) : (
          <Blankslate icon={StarIcon} title={`${username} doesn’t have any starred repositories yet.`} />
        ))}
    </section>
  );
}
