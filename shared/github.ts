// Facts about GitHub shared by the browser app (src/) and the server code (server/, netlify/).
// It imports nothing, so neither side depends on the other.

/** GitHub logins: letters, digits and single hyphens, not at the start or end, max 39 characters. */
export const LOGIN_PATTERN_SOURCE = '[a-z\\d](?:[a-z\\d]|-(?=[a-z\\d])){0,38}';
export const LOGIN_PATTERN = new RegExp(`^${LOGIN_PATTERN_SOURCE}$`, 'i');

/** GitHub launched in 2008, so no contribution calendar starts earlier. */
export const FIRST_GITHUB_YEAR = 2008;

export const GITHUB_URL = 'https://github.com';
export const GITHUB_API_URL = 'https://api.github.com';

/** A page on github.com, e.g. githubUrl('UptimeAI/uptime_webapp'). */
export function githubUrl(path: string): string {
  return `${GITHUB_URL}/${path}`;
}

/** Where the browser calls the contributions function (Netlify serves functions at /.netlify/functions/<name>). */
export const CONTRIBUTIONS_PATH = '/.netlify/functions/contributions';

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface ContributionDay {
  /** YYYY-MM-DD */
  date: string;
  count: number;
  level: ContributionLevel;
}

export interface ContributionCalendar {
  total: number;
  /** Sorted by date. */
  days: ContributionDay[];
  /** First day, YYYY-MM-DD */
  from: string;
  /** Last day, YYYY-MM-DD */
  to: string;
}
