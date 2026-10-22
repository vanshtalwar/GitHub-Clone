// Loads everything the profile page needs for one user, falling back to mock data section by section.
// This is the only place that decides between live and sample data for the profile; components just render
// what they get (including `extras`, which is null when there's no sample data for the user).
import { describeFailure, type LoadFailure } from '../api/failure';
import { getForkParent, getOrgs, getRepos, getSocialAccounts, getStarredCount, getUser, type ForkParent } from '../api/github';
import { NotFoundError } from '../api/http';
import { getProfileDetails } from '../api/profileDetails';
import {
  hasMockProfile,
  mockDetails,
  mockExtras,
  mockOrgs,
  mockRepos,
  mockSocials,
  mockStarredCount,
  mockUser,
} from '../mocks/profile';
import type { GithubUser, Org, ProfileDetails, ProfileExtras, Repo, SocialAccount, UserStatus } from '../types/github';
import { selectPopularRepos } from '../utils/repos';

export interface ProfileData {
  user: GithubUser;
  repos: Repo[];
  socials: SocialAccount[];
  orgs: Org[];
  starredCount: number;
  /** The status message on the avatar (GraphQL); null if the user has none. */
  userStatus: UserStatus | null;
  /** The Projects tab (GraphQL); null if they couldn't be loaded. */
  projects: ProfileDetails['projects'] | null;
  /** Parts with no usable public API (achievements, packages count); null if there's no sample data. */
  extras: ProfileExtras | null;
  /** Set when some sections show sample data, and why (drives the fallback banner). */
  failure?: LoadFailure;
}

export type ProfileState =
  | { status: 'loading' }
  | { status: 'notFound' }
  /** Live data failed for a user we have no mock data for. */
  | { status: 'error'; failure: LoadFailure }
  | ({ status: 'ready' } & ProfileData);

/**
 * Fetches all sections in parallel. Never rejects.
 * - A 404 on the user means the profile doesn't exist: notFound, no mock.
 * - Any other failure: for users with sample data (shreeramk), only that section is replaced with mock data;
 *   for anyone else the profile can't be shown honestly, so the result is an error.
 * - The status and projects (GraphQL) are optional: if they fail, the profile still shows, without them (or with
 *   the sample values for shreeramk).
 * Fork parents ("Forked from …") are loaded separately afterwards (loadForkParents), so they don't hold up the page.
 */
export async function loadProfile(username: string): Promise<ProfileState> {
  const [user, repos, socials, orgs, starredCount, details] = await Promise.allSettled([
    getUser(username),
    getRepos(username),
    getSocialAccounts(username),
    getOrgs(username),
    getStarredCount(username),
    getProfileDetails(username),
  ]);

  if (user.status === 'rejected' && user.reason instanceof NotFoundError) {
    return { status: 'notFound' };
  }

  const sample = hasMockProfile(username);
  const errors = [user, repos, socials, orgs, starredCount].flatMap((result) =>
    result.status === 'rejected' ? [result.reason] : [],
  );
  if (errors.length > 0 && !sample) {
    return { status: 'error', failure: describeFailure(errors) };
  }

  const value = <T>(result: PromiseSettledResult<T>, mock: T): T => (result.status === 'fulfilled' ? result.value : mock);
  // GitHub's API lists only public org memberships. The design is the owner's view, which includes private ones
  // (shreeramk's UptimeAI membership is private), so for users with sample data an empty list shows the sample orgs.
  const liveOrgs = value(orgs, mockOrgs);
  const profileDetails = detailsOrFallback(details, sample);
  const fallbackErrors = sample && details.status === 'rejected' ? [...errors, details.reason] : errors;

  return {
    status: 'ready',
    user: value(user, mockUser),
    repos: value(repos, mockRepos),
    socials: value(socials, mockSocials),
    orgs: liveOrgs.length === 0 && sample ? mockOrgs : liveOrgs,
    starredCount: value(starredCount, mockStarredCount),
    userStatus: profileDetails?.status ?? null,
    projects: profileDetails?.projects ?? null,
    extras: mockExtras(username),
    ...(fallbackErrors.length > 0 && { failure: describeFailure(fallbackErrors) }),
  };
}

/**
 * Live status and projects; if they failed, the sample values (shreeramk) or nothing. GraphQL has no `user` for an
 * organization's login (REST does), which simply means no status and no projects.
 */
function detailsOrFallback(details: PromiseSettledResult<ProfileDetails>, sample: boolean): ProfileDetails | null {
  if (details.status === 'fulfilled') return details.value;
  if (sample) return mockDetails;
  return details.reason instanceof NotFoundError ? { status: null, projects: { totalCount: 0, items: [] } } : null;
}

/** Forks shown in Popular repositories that still need their parent looked up (mock repos already have it). */
export function forksNeedingParents(repos: Repo[]): Repo[] {
  return selectPopularRepos(repos).filter((repo) => repo.fork && !repo.parentFullName);
}

/** Looks up each fork's parent (one request each, cached). Never rejects: a failed lookup is just left out. */
export async function loadForkParents(forks: Repo[]): Promise<Map<string, ForkParent>> {
  const results = await Promise.allSettled(
    forks.map((repo) => {
      const [owner, name] = repo.fullName.split('/');
      return getForkParent(owner, name);
    }),
  );
  const parents = new Map<string, ForkParent>();
  forks.forEach((repo, i) => {
    const result = results[i];
    if (result.status === 'fulfilled' && result.value) parents.set(repo.fullName, result.value);
  });
  return parents;
}

/** Adds "Forked from …"; a fork without a language of its own shows its parent's, like github.com. */
export function withForkParents(repos: Repo[], parents: Map<string, ForkParent>): Repo[] {
  if (parents.size === 0) return repos;
  return repos.map((repo) => {
    const parent = parents.get(repo.fullName);
    return parent ? { ...repo, parentFullName: parent.fullName, language: repo.language ?? parent.language } : repo;
  });
}
