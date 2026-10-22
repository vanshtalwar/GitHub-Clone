import { CloudOfflineIcon } from '@primer/octicons-react';
import { Link } from 'react-router';
import { describeLoadFailure, type LoadFailure } from '../api/failure';
import { Blankslate } from '../components/common/Blankslate';
import { DEFAULT_USERNAME } from '../config';
import styles from './TabPage.module.css';

/** Live data failed for a user we have no sample data for (sample data exists only for the default user). */
export function ProfileErrorPage({ username, failure }: { username: string; failure: LoadFailure }) {
  return (
    <Blankslate icon={CloudOfflineIcon} title="Couldn’t load this profile">
      <p>
        {username}’s profile can’t be shown right now. {describeLoadFailure(failure)}
      </p>
      <p>
        {/* Failures aren't cached, so a reload asks GitHub again */}
        <button type="button" className={styles.button} onClick={() => window.location.reload()}>
          Try again
        </button>
      </p>
      <p>
        <Link to={`/${DEFAULT_USERNAME}`}>View @{DEFAULT_USERNAME} instead</Link> (sample data is available for this
        profile).
      </p>
    </Blankslate>
  );
}
