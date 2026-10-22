import {
  CopilotIcon,
  GitPullRequestIcon,
  InboxIcon,
  IssueOpenedIcon,
  MarkGithubIcon,
  PlusIcon,
  SearchIcon,
  ThreeBarsIcon,
  TriangleDownIcon,
} from '@primer/octicons-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { githubUrl, LOGIN_PATTERN } from '../../../shared/github';
import { useProfile } from '../../hooks/useProfile';
import styles from './Header.module.css';

const GITHUB_HOME = githubUrl('');

/**
 * GitHub's logged-in app header, as in the screenshot. The search box jumps to another user's profile here;
 * the other controls link to the matching github.com pages (which ask the visitor to sign in).
 */
export function Header({ username }: { username: string }) {
  const profile = useProfile();
  const avatarUrl = profile.status === 'ready' ? profile.user.avatarUrl : undefined;
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className={styles.header}>
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div className={styles.left}>
        <a href={GITHUB_HOME} className={styles.iconButton} aria-label="GitHub home">
          <ThreeBarsIcon />
        </a>
        <Link to="/" className={styles.logo} aria-label="Homepage">
          <MarkGithubIcon size={32} />
        </Link>
        <Link to={`/${username}`} className={styles.context}>
          {username}
        </Link>
      </div>

      <UserSearch open={searchOpen} onOpenChange={setSearchOpen} />

      <div className={styles.right}>
        <button
          type="button"
          className={`${styles.iconButton} ${styles.mobileOnly}`}
          aria-label="Search"
          aria-expanded={searchOpen}
          onClick={() => setSearchOpen((open) => !open)}
        >
          <SearchIcon />
        </button>
        <a href={githubUrl('copilot')} className={`${styles.iconButton} ${styles.splitButton} ${styles.desktopOnly}`} aria-label="GitHub Copilot">
          <CopilotIcon />
          <span className={styles.splitDivider} aria-hidden="true" />
          <TriangleDownIcon />
        </a>
        <span className={`${styles.divider} ${styles.desktopOnly}`} aria-hidden="true" />
        <a href={githubUrl('new')} className={`${styles.iconButton} ${styles.createButton} ${styles.smUp}`} aria-label="Create a new repository">
          <PlusIcon />
          <TriangleDownIcon />
        </a>
        <a href={githubUrl('issues')} className={`${styles.iconButton} ${styles.desktopOnly}`} aria-label="Your issues">
          <IssueOpenedIcon />
        </a>
        <a href={githubUrl('pulls')} className={`${styles.iconButton} ${styles.desktopOnly}`} aria-label="Your pull requests">
          <GitPullRequestIcon />
        </a>
        <a href={githubUrl('notifications')} className={styles.iconButton} aria-label="Notifications">
          <InboxIcon />
          <span className={styles.unreadDot} aria-hidden="true" />
        </a>
        <a href={githubUrl(username)} className={styles.avatar} aria-label={`${username} on GitHub`}>
          {avatarUrl && <img src={avatarUrl} alt="" width={32} height={32} />}
        </a>
      </div>
    </header>
  );
}

/** "Type / to search": "/" focuses it from anywhere; Enter with a username opens that profile. */
function UserSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || isEditable(event.target)) return;
      event.preventDefault();
      onOpenChange(true);
      inputRef.current?.focus();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onOpenChange]);

  // On phones the field is hidden until opened; focus it once it's visible.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const login = query.trim().replace(/^@/, '');
    if (!LOGIN_PATTERN.test(login)) return;
    setQuery('');
    onOpenChange(false);
    inputRef.current?.blur();
    navigate(`/${login}`);
  }

  return (
    <form role="search" className={`${styles.search} ${open ? styles.searchOpen : ''}`} onSubmit={onSubmit}>
      <SearchIcon className={styles.searchIcon} />
      <input
        ref={inputRef}
        className={styles.searchInput}
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.currentTarget.blur();
            onOpenChange(false);
          }
        }}
        placeholder="Jump to a GitHub user…"
        aria-label="Jump to a GitHub user"
        aria-keyshortcuts="/"
        autoComplete="off"
        spellCheck={false}
      />
      <span className={styles.searchHint} aria-hidden="true">
        Type <kbd>/</kbd> to search
      </span>
    </form>
  );
}

function isEditable(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}
