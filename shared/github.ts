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

/** Where the browser calls the GitHub REST function, with ?path=<REST path>. */
export const GITHUB_REST_PATH = '/.netlify/functions/github';

/** Where the browser calls the activity function (?user=&y=): activity overview + monthly timeline. */
export const ACTIVITY_PATH = '/.netlify/functions/activity';

/** Where the browser calls the profile details function (?user=): status and projects. */
export const PROFILE_DETAILS_PATH = '/.netlify/functions/profile';

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

// ---- Profile details (GraphQL-only parts of the profile) ----

/** Status message shown on the avatar. */
export interface UserStatus {
  /** The emoji character, or "" when there is none (GitHub then shows a smiley icon). */
  emoji: string;
  message: string;
}

/** A GitHub Project (the Projects tab). */
export interface Project {
  title: string;
  shortDescription: string | null;
  url: string;
  closed: boolean;
  /** ISO timestamp */
  updatedAt: string;
}

export interface ProfileDetails {
  status: UserStatus | null;
  projects: { totalCount: number; items: Project[] };
}

// ---- Activity (the "Activity overview" panel and the "Contribution activity" timeline) ----

export interface ActivityOrg {
  login: string;
  avatarUrl: string;
}

export interface ActivityOverview {
  /** Org chips above the overview. */
  orgs: ActivityOrg[];
  /** Repos named in "Contributed to A, B, C" */
  contributedTo: string[];
  /** The "and N other repositories" count. */
  otherRepoCount: number;
  /** Share of contributions by type, in percent. */
  breakdown: {
    commits: number;
    pullRequests: number;
    issues: number;
    codeReview: number;
  };
}

export interface CommitActivity {
  kind: 'commits';
  repos: { name: string; count: number }[];
}

export interface PullRequestActivity {
  kind: 'pullRequests';
  repos: { name: string; merged: number; open: number; closed: number }[];
}

/** Contributions to private repositories: GitHub only reveals how many there were. */
export interface PrivateActivity {
  kind: 'private';
  count: number;
}

export type ActivityItem = CommitActivity | PullRequestActivity | PrivateActivity;

/** One month of the timeline. */
export interface ActivityMonth {
  /** Months before the last month of the selected period (0 = that month). */
  monthsAgo: number;
  /** "YYYY-MM" for live data. Sample data has none, so its months follow the selected period and never look dated. */
  month?: string;
  items: ActivityItem[];
}

export interface ActivityData {
  overview: ActivityOverview;
  /** Newest first; months without any activity are left out. */
  months: ActivityMonth[];
}
