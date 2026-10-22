// App settings in one place. GitHub facts shared with the server live in shared/github.ts.

/** Profile shown at "/" — the user from the assignment. */
export const DEFAULT_USERNAME = 'shreeramk';

/** How many repos "Popular repositories" shows. */
export const POPULAR_REPO_COUNT = 6;
/** GitHub returns at most 100 per page; the Repositories tab shows the first page (most recently updated). */
export const REPOS_PAGE_SIZE = 100;
/** The Stars tab shows the most recently starred repos. */
export const STARRED_PAGE_SIZE = 30;

/** API responses are cached in localStorage for this long (unauthenticated GitHub allows 60 calls per hour). */
export const CACHE_TTL_MS = 60 * 60 * 1000;
/** A request taking longer than this fails instead of leaving a section loading forever. */
export const REQUEST_TIMEOUT_MS = 10_000;

/** Prefix for everything this app keeps in localStorage. */
export const STORAGE_PREFIX = 'gh-profile:';

export const DOCS_URLS = {
  contributions:
    'https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/troubleshooting-missing-contributions',
  profileGuide: 'https://docs.github.com/en/account-and-profile/how-tos',
  pinnedItems: 'https://docs.github.com/en/account-and-profile/how-tos/profile-customization/pinning-items-to-your-profile',
} as const;
