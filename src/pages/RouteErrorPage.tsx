import { AlertIcon } from '@primer/octicons-react';
import { useEffect } from 'react';
import { Link, useRouteError } from 'react-router';
import { Blankslate } from '../components/common/Blankslate';
import { DEFAULT_USERNAME } from '../config';
import styles from './TabPage.module.css';

/**
 * Last-resort screen for errors no section caught, instead of React Router's developer error page.
 * A failed code download (e.g. a tab left open across a redeploy) is fixed by reloading.
 */
export function RouteErrorPage() {
  const error = useRouteError();
  useEffect(() => console.error('Unhandled route error', error), [error]);

  return (
    <main id="main-content" className={styles.errorPage}>
      <Blankslate icon={AlertIcon} title="Something went wrong">
        <p>This page couldn’t be displayed. Reloading usually fixes it.</p>
        <p>
          <button type="button" className={styles.button} onClick={() => window.location.reload()}>
            Reload
          </button>
        </p>
        <p>
          <Link to={`/${DEFAULT_USERNAME}`} reloadDocument>
            Go to @{DEFAULT_USERNAME}
          </Link>
        </p>
      </Blankslate>
    </main>
  );
}
