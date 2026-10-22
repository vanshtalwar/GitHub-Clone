// GitHub REST API client. Requests go through the site's GitHub function (server/githubRest.ts), which adds the
// server token; see get(). Every call is cached; see cache.ts.
import { GITHUB_API_URL, GITHUB_REST_PATH } from '../../shared/github';
import { REPOS_PAGE_SIZE, STARRED_PAGE_SIZE } from '../config';
import type { GithubUser, Org, Repo, SocialAccount } from '../types/github';
import { cached } from './cache';
import { fetchJson, NotFoundError, type JsonResponse } from './http';

const GITHUB_JSON = 'application/vnd.github+json';

// Raw response shapes: only the fields we use.
interface ApiUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  company: string | null;
  blog: string | null;
  location: string | null;
  email: string | null;
  twitter_username: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

interface ApiRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  visibility?: string;
  fork: boolean;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  parent?: { full_name: string; language: string | null };
}

export interface ForkParent {
  /** "owner/name" */
  fullName: string;
  /** The upstream repo's language. GitHub shows it for forks whose own language is null. */
  language: string | null;
}

interface ApiOrg {
  login: string;
  avatar_url: string;
}

/**
 * GETs a REST path such as `/users/octo`. It asks the site's GitHub function first: with the server token, visitors
 * share 5,000 requests per hour. If the function can't answer (not deployed, no token, GitHub unreachable or its
 * quota used up), the browser asks GitHub directly, which allows 60 requests per hour per IP. A 404 is GitHub's own
 * answer ("no such user"), so it isn't retried.
 */
async function get<T>(path: string): Promise<JsonResponse<T>> {
  try {
    return await fetchJson<T>(`${GITHUB_REST_PATH}?path=${encodeURIComponent(path)}`, { accept: GITHUB_JSON });
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    return fetchJson<T>(GITHUB_API_URL + path, { accept: GITHUB_JSON });
  }
}

const userPath = (username: string) => `/users/${encodeURIComponent(username)}`;
// GitHub logins are case-insensitive, so cache keys are too.
const cacheKey = (...parts: string[]) => parts.join(':').toLowerCase();

export function getUser(username: string): Promise<GithubUser> {
  return cached(cacheKey('user', username), async () => toUser((await get<ApiUser>(userPath(username))).data));
}

export function getRepos(username: string): Promise<Repo[]> {
  return cached(cacheKey('repos', username), async () => {
    const { data } = await get<ApiRepo[]>(`${userPath(username)}/repos?per_page=${REPOS_PAGE_SIZE}&sort=updated`);
    return data.map(toRepo);
  });
}

/** The repo this fork came from, or null if it isn't a fork. Costs one request per repo. */
export function getForkParent(owner: string, repo: string): Promise<ForkParent | null> {
  return cached(cacheKey('parent', owner, repo), async () => {
    const { data } = await get<ApiRepo>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
    return data.parent ? { fullName: data.parent.full_name, language: data.parent.language } : null;
  });
}

export function getSocialAccounts(username: string): Promise<SocialAccount[]> {
  return cached(cacheKey('socials', username), async () => {
    const { data } = await get<SocialAccount[]>(`${userPath(username)}/social_accounts`);
    return data.map(({ provider, url }) => ({ provider, url }));
  });
}

/** Public org memberships only; private memberships aren't visible without a token. */
export function getOrgs(username: string): Promise<Org[]> {
  return cached(cacheKey('orgs', username), async () => {
    const { data } = await get<ApiOrg[]>(`${userPath(username)}/orgs`);
    return data.map((org) => ({ login: org.login, avatarUrl: org.avatar_url }));
  });
}

/** Counts stars with a single request: at one item per page, the last page number is the total. */
export function getStarredCount(username: string): Promise<number> {
  return cached(cacheKey('starred-count', username), async () => {
    const { data, headers } = await get<ApiRepo[]>(`${userPath(username)}/starred?per_page=1`);
    return parseLastPage(headers.get('link')) ?? data.length;
  });
}

/** The most recently starred repos (one page). Loaded only when the Stars tab is opened. */
export function getStarred(username: string): Promise<Repo[]> {
  return cached(cacheKey('starred', username), async () => {
    const { data } = await get<ApiRepo[]>(`${userPath(username)}/starred?per_page=${STARRED_PAGE_SIZE}`);
    return data.map(toRepo);
  });
}

/** Page number of rel="last" in a GitHub Link header, e.g. `<https://…?per_page=1&page=5>; rel="last"` → 5. */
export function parseLastPage(link: string | null): number | undefined {
  if (!link) return undefined;
  for (const part of link.split(',')) {
    const match = /<([^>]+)>\s*;\s*rel="last"/.exec(part);
    if (match) {
      const page = Number(new URL(match[1]).searchParams.get('page'));
      return Number.isInteger(page) && page > 0 ? page : undefined;
    }
  }
  return undefined;
}

function toUser(user: ApiUser): GithubUser {
  return {
    login: user.login,
    name: user.name,
    avatarUrl: user.avatar_url,
    htmlUrl: user.html_url,
    bio: user.bio,
    company: user.company,
    blog: user.blog,
    location: user.location,
    email: user.email,
    twitterUsername: user.twitter_username,
    publicRepos: user.public_repos,
    followers: user.followers,
    following: user.following,
    createdAt: user.created_at,
  };
}

function toRepo(repo: ApiRepo): Repo {
  return {
    name: repo.name,
    fullName: repo.full_name,
    htmlUrl: repo.html_url,
    description: repo.description,
    visibility: repo.visibility ?? (repo.private ? 'private' : 'public'),
    fork: repo.fork,
    language: repo.language,
    stargazersCount: repo.stargazers_count,
    forksCount: repo.forks_count,
    createdAt: repo.created_at,
    updatedAt: repo.updated_at,
  };
}
