import { useCallback, useState } from 'react';
import { Outlet } from 'react-router';
import type { LoadFailure } from '../../api/failure';
import { ProfileProvider } from '../../context/ProfileContext';
import type { ProfileState } from '../../context/loadProfile';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { FallbackNoticeContext } from '../../hooks/useFallbackNotice';
import { useProfile } from '../../hooks/useProfile';
import { useUsername } from '../../hooks/useUsername';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { ProfileErrorPage } from '../../pages/ProfileErrorPage';
import { ProfileSidebar } from '../sidebar/ProfileSidebar';
import { FallbackBanner } from './FallbackBanner';
import { Footer } from './Footer';
import { Header } from './Header';
import { TabNav } from './TabNav';
import styles from './ProfileLayout.module.css';

/** Page frame for every tab of /:username: header, tab bar, sidebar, the active tab (<Outlet/>), footer. */
export function ProfileLayout() {
  const username = useUsername();

  return (
    <ProfileProvider username={username}>
      <Header username={username} />
      <ProfileBody username={username} />
      <Footer />
    </ProfileProvider>
  );
}

function pageTitle(profile: ProfileState): string | undefined {
  switch (profile.status) {
    case 'ready':
      return profile.user.name ? `${profile.user.login} (${profile.user.name})` : profile.user.login;
    case 'notFound':
      return 'User not found';
    case 'error':
      return 'Couldn’t load profile';
    default:
      return undefined;
  }
}

function ProfileBody({ username }: { username: string }) {
  const profile = useProfile();
  useDocumentTitle(pageTitle(profile));

  // Sections outside the profile data (e.g. the contribution graph) report when they fall back to sample data.
  const [notices, setNotices] = useState<Record<string, LoadFailure>>({});
  const reportFallback = useCallback((key: string, failure: LoadFailure | null) => {
    setNotices((current) => {
      if (failure ? current[key] === failure : !(key in current)) return current; // nothing changed
      const next = { ...current };
      if (failure) next[key] = failure;
      else delete next[key];
      return next;
    });
  }, []);

  if (profile.status === 'notFound') {
    return (
      <main id="main-content" tabIndex={-1} className={styles.message}>
        <NotFoundPage username={username} />
      </main>
    );
  }
  if (profile.status === 'error') {
    return (
      <main id="main-content" tabIndex={-1} className={styles.message}>
        <ProfileErrorPage username={username} failure={profile.failure} />
      </main>
    );
  }

  // The profile's own fallback first, then any section that reported one (e.g. the contribution graph).
  const bannerFailure = (profile.status === 'ready' ? profile.failure : undefined) ?? Object.values(notices)[0];

  // One grid, so the tab bar can sit under the header on desktop and below the sidebar on phones (design/04).
  return (
    <FallbackNoticeContext value={reportFallback}>
      <main id="main-content" tabIndex={-1} className={styles.grid}>
        <TabNav className={styles.tabs} />
        {bannerFailure && <FallbackBanner key={username} failure={bannerFailure} className={styles.banner} />}
        <aside className={styles.sidebar} aria-label="Profile">
          <ProfileSidebar />
        </aside>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
    </FallbackNoticeContext>
  );
}
