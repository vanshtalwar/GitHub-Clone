import { BookIcon, PackageIcon, RepoIcon, StarIcon, TableIcon } from '@primer/octicons-react';
import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useProfile } from '../../hooks/useProfile';
import { formatCount } from '../../utils/format';
import styles from './TabNav.module.css';

type CountKey = 'repos' | 'projects' | 'stars';

// Relative links: this renders inside the /:username layout route, so they work for any user.
const TABS = [
  { to: '', label: 'Overview', icon: BookIcon },
  { to: 'repositories', label: 'Repositories', icon: RepoIcon, count: 'repos' },
  { to: 'projects', label: 'Projects', icon: TableIcon, count: 'projects' },
  // No counter: GitHub only lists packages to classic tokens, so the count can't be known
  { to: 'packages', label: 'Packages', icon: PackageIcon },
  { to: 'stars', label: 'Stars', icon: StarIcon, count: 'stars' },
] as const satisfies readonly { to: string; label: string; icon: unknown; count?: CountKey }[];

export function TabNav({ className = '' }: { className?: string }) {
  const profile = useProfile();
  const navRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  // On phones the bar scrolls sideways: bring the active tab into view. (scrollIntoView would also scroll the page.)
  // Re-run when the profile loads, because the counters change the tab widths.
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !active || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
  }, [pathname, profile.status]);
  const counts: Partial<Record<CountKey, number>> =
    profile.status === 'ready'
      ? {
          repos: profile.user.publicRepos,
          projects: profile.projects?.totalCount,
          stars: profile.starredCount,
        }
      : {};

  return (
    <nav ref={navRef} aria-label="User profile" className={`${styles.nav} ${className}`}>
      <ul className={styles.list}>
        {TABS.map((tab) => {
          const count = 'count' in tab ? counts[tab.count] : undefined;
          return (
            <li key={tab.label} className={styles.item}>
              <NavLink
                to={tab.to}
                end={tab.to === ''}
                // Without this, the label and counter are read as one word ("Repositories6").
                aria-label={count ? `${tab.label} (${formatCount(count)})` : undefined}
                className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
              >
                <tab.icon className={styles.icon} />
                {/* data-content reserves the bold width, so the active tab doesn't shift its neighbours */}
                <span className={styles.label} data-content={tab.label}>
                  {tab.label}
                </span>
                {count ? (
                  <span className={styles.counter} title={String(count)}>
                    {formatCount(count)}
                  </span>
                ) : null}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
