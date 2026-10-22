// Loads everything the profile page needs for one user, falling back to mock data section by section.
// This is the only place that decides between live and sample data for the profile; components just render
// what they get (including `extras`, which is null when there's no sample data for the user).
import { describeFailure, type LoadFailure } from '../api/failure';
import { getForkParent, getOrgs, getRepos, getSocialAccounts, getStarredCount, getUser, type ForkParent } from '../api/github';
import { NotFoundError } from '../api/http';
import { hasMockProfile, mockExtras, mockOrgs, mockRepos, mockSocials, mockStarredCount, mockUser } from '../mocks/profile';
import type { GithubUser, Org, ProfileExtras, Repo, SocialAccount } from '../types/github';
import { selectPopularRepos } from '../utils/repos';

export interface ProfileData {
  user: GithubUser;
  repos: Repo[];
  socials: SocialAccount[];
  orgs: Org[];
  starredCount: number;
  /** Parts with no public API (status, achievements, packages, activity); null if there's no sample data. */
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
 * Fork parents ("Forked from …") are loaded separately afterwards (loadForkParents), so they don't hold up the page.
 */
export async function loadProfile(username: string): Promise<ProfileState> {
  const [user, repos, socials, orgs, starredCount] = await Promise.allSettled([
    getUser(username),
    getRepos(username),
    getSocialAccounts(username),
    getOrgs(username),
    getStarredCount(username),
  ]);

  if (user.status === 'rejected' && user.reason instanceof NotFoundError) {
    return { status: 'notFound' };
  }

  const errors = [user, repos, socials, orgs, starredCount].flatMap((result) =>
    result.status === 'rejected' ? [result.reason] : [],
  );
  if (errors.length > 0 && !hasMockProfile(username)) {
    return { status: 'error', failure: describeFailure(errors) };
  }

  const value = <T>(result: PromiseSettledResult<T>, mock: T): T => (result.status === 'fulfilled' ? result.value : mock);
  // GitHub's API lists only public org memberships. The design is the owner's view, which includes private ones
  // (shreeramk's UptimeAI membership is private), so for users with sample data an empty list shows the sample orgs.
  const liveOrgs = value(orgs, mockOrgs);
  return {
    status: 'ready',
    user: value(user, mockUser),
    repos: value(repos, mockRepos),
    socials: value(socials, mockSocials),
    orgs: liveOrgs.length === 0 && hasMockProfile(username) ? mockOrgs : liveOrgs,
    starredCount: value(starredCount, mockStarredCount),
    extras: mockExtras(username),
    ...(errors.length > 0 && { failure: describeFailure(errors) }),
  };
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
