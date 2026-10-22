// Server-side only: fetches a user's contribution calendar from GitHub's GraphQL API (requirement 3a).
// GraphQL needs a token, which must never reach the browser, so this runs in the Netlify Function
// (netlify/functions/contributions.mts) and in the Vite dev/preview middleware (vite.config.ts).
import {
  FIRST_GITHUB_YEAR,
  GITHUB_API_URL,
  LOGIN_PATTERN,
  type ContributionCalendar,
  type ContributionLevel,
} from '../shared/github.ts';

const GRAPHQL_URL = `${GITHUB_API_URL}/graphql`;
const USER_AGENT = 'github-profile-assignment';
/** Fail before Netlify's own function timeout (10 s) so the client gets a proper answer. */
const GITHUB_TIMEOUT_MS = 8_000;

export const CONTRIBUTIONS_QUERY = `query ($login: String!, $from: DateTime, $to: DateTime) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

// GitHub's ContributionLevel enum → the 0–4 level the heatmap colours by
const LEVELS: Record<string, ContributionLevel> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

interface GraphQLResponse {
  data?: {
    user: {
      contributionsCollection?: {
        contributionCalendar?: {
          totalContributions: number;
          weeks: { contributionDays: { date: string; contributionCount: number; contributionLevel: string }[] }[];
        };
      };
    } | null;
  };
  errors?: { type?: string; message: string }[];
}

export interface ContributionsResult {
  status: number;
  body: ContributionCalendar | { error: string };
  /** Rate-limit details forwarded from GitHub (x-ratelimit-*), so the browser can say when to retry. */
  rateLimitHeaders?: Record<string, string>;
}

export interface ContributionsOptions {
  token: string | undefined;
  /** Logins this server will answer for (lowercase). Empty = anyone. Limits how others can spend the token's quota. */
  allowedUsers?: string[];
  fetchImpl?: typeof fetch;
}

/**
 * Handles `?user=<login>&y=last|YYYY`. "last" is GitHub's default window (the profile's "in the last year");
 * a year is Jan 1 – Dec 31. Never throws: every outcome, including unexpected errors, is a status + JSON body.
 */
export async function getContributionCalendar(params: URLSearchParams, options: ContributionsOptions): Promise<ContributionsResult> {
  try {
    return await fetchCalendar(params, options);
  } catch {
    return { status: 500, body: { error: 'Unexpected error while loading contributions' } };
  }
}

async function fetchCalendar(
  params: URLSearchParams,
  { token, allowedUsers = [], fetchImpl = fetch }: ContributionsOptions,
): Promise<ContributionsResult> {
  const login = params.get('user') ?? '';
  const period = params.get('y') ?? 'last';
  const year = period === 'last' ? null : Number(period);

  if (!LOGIN_PATTERN.test(login)) return { status: 400, body: { error: 'Invalid user' } };
  if (year !== null && !(Number.isInteger(year) && year >= FIRST_GITHUB_YEAR && year <= new Date().getUTCFullYear())) {
    return { status: 400, body: { error: 'Invalid year' } };
  }
  if (allowedUsers.length > 0 && !allowedUsers.includes(login.toLowerCase())) {
    return { status: 403, body: { error: 'This server does not serve contributions for that user' } };
  }
  if (!token) return { status: 500, body: { error: 'GITHUB_TOKEN is not configured on the server' } };

  const variables = year === null ? { login } : { login, from: `${year}-01-01T00:00:00Z`, to: `${year}-12-31T23:59:59Z` };

  let response: Response;
  try {
    response = await fetchImpl(GRAPHQL_URL, {
      method: 'POST',
      headers: { Authorization: `bearer ${token}`, 'Content-Type': 'application/json', 'User-Agent': USER_AGENT },
      body: JSON.stringify({ query: CONTRIBUTIONS_QUERY, variables }),
      signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
    return timedOut
      ? { status: 504, body: { error: 'GitHub did not answer in time' } }
      : { status: 502, body: { error: 'GitHub could not be reached' } };
  }

  if (response.status === 401) return { status: 500, body: { error: 'GitHub rejected the server token' } };
  if (isRateLimited(response)) {
    return { status: 429, body: { error: 'GitHub rate limit reached' }, rateLimitHeaders: rateLimitHeaders(response.headers) };
  }
  if (!response.ok) return { status: 502, body: { error: `GitHub answered ${response.status}` } };

  let json: GraphQLResponse;
  try {
    json = (await response.json()) as GraphQLResponse;
  } catch {
    return { status: 502, body: { error: 'GitHub sent an invalid response' } };
  }

  if (json.errors?.some((error) => error.type === 'NOT_FOUND') || json.data?.user === null) {
    return { status: 404, body: { error: `GitHub user "${login}" not found` } };
  }
  if (json.errors?.some((error) => error.type === 'RATE_LIMITED')) {
    return { status: 429, body: { error: 'GitHub rate limit reached' }, rateLimitHeaders: rateLimitHeaders(response.headers) };
  }
  const calendar = json.data?.user?.contributionsCollection?.contributionCalendar;
  if (!calendar) return { status: 502, body: { error: json.errors?.[0]?.message ?? 'Unexpected response from GitHub' } };

  const days = calendar.weeks
    .flatMap((week) => week.contributionDays)
    .map((day) => ({ date: day.date, count: day.contributionCount, level: LEVELS[day.contributionLevel] ?? 0 }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    status: 200,
    body: { total: calendar.totalContributions, days, from: days[0]?.date ?? '', to: days.at(-1)?.date ?? '' },
  };
}

/** Only real rate limits: GitHub also answers 403 for other refusals (e.g. a token without access). */
function isRateLimited({ status, headers }: Response): boolean {
  if (status === 429) return true;
  return status === 403 && (headers.get('x-ratelimit-remaining') === '0' || headers.has('retry-after'));
}

function rateLimitHeaders(headers: Headers): Record<string, string> {
  const forwarded: Record<string, string> = {};
  for (const name of ['x-ratelimit-limit', 'x-ratelimit-reset', 'retry-after']) {
    const value = headers.get(name);
    if (value) forwarded[name] = value;
  }
  return forwarded;
}

/** Response headers: successful calendars are cached 5 min in the browser and 1 h on Netlify's CDN. */
export function contributionsHeaders({ status, rateLimitHeaders: forwarded }: ContributionsResult): Record<string, string> {
  const caching: Record<string, string> =
    status === 200
      ? {
          'Cache-Control': 'public, max-age=300',
          'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=3600, stale-while-revalidate=86400',
          'Netlify-Vary': 'query=user|y',
        }
      : { 'Cache-Control': 'no-store' };
  return { 'Content-Type': 'application/json', ...caching, ...forwarded };
}

/** CONTRIBUTIONS_ALLOWED_USERS="shreeramk,octocat" → ["shreeramk", "octocat"]; unset → [] (anyone). */
export function parseAllowedUsers(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((login) => login.trim().toLowerCase())
    .filter(Boolean);
}
