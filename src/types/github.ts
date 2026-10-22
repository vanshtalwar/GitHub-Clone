// Domain types used by the UI. The API clients map GitHub's snake_case responses into these,
// so components never depend on raw API shapes.
export type {
  ContributionCalendar,
  ContributionDay,
  ContributionLevel,
  ProfileDetails,
  Project,
  UserStatus,
} from '../../shared/github';

/** Where a piece of data came from: the live API, or mock data used as a fallback. */
export type DataSource = 'live' | 'mock';

export interface GithubUser {
  login: string;
  name: string | null;
  avatarUrl: string;
  htmlUrl: string;
  bio: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  twitterUsername: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  /** ISO timestamp; the year list starts from this year. */
  createdAt: string;
}

export interface Repo {
  name: string;
  /** "owner/name" */
  fullName: string;
  htmlUrl: string;
  description: string | null;
  /** "public", "private" or "internal" */
  visibility: string;
  fork: boolean;
  /** "owner/name" of the upstream repo. The repo list endpoint doesn't include it, so it's filled in separately. */
  parentFullName?: string;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SocialAccount {
  /** "linkedin", "twitter", "generic", … */
  provider: string;
  url: string;
}

export interface Org {
  login: string;
  avatarUrl: string;
}

/** Profile achievement badge. No public API. */
export interface Achievement {
  name: string;
  /** Path under public/, e.g. "/achievements/yolo.png" */
  image: string;
  /** Tier label such as "x4" */
  tier?: string;
}

/**
 * Profile parts with no usable public API: achievements have none, and GitHub only lists packages to classic tokens
 * with package access. Only available where sample data exists (shreeramk); null for everyone else, and the UI then
 * leaves those parts out.
 */
export interface ProfileExtras {
  achievements: Achievement[];
  packagesCount: number;
}

/** "last" is the rolling last year (GitHub's default view); a number is that calendar year. */
export type ContributionPeriod = 'last' | number;
