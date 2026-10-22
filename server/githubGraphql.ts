// Server-side only: what the GraphQL-backed functions share (contributions, activity, profile details): reading
// ?user= and ?y=, the allow-list and token checks, running a query for one user, and turning the outcome into a response.
import { FIRST_GITHUB_YEAR, GITHUB_API_URL, LOGIN_PATTERN } from '../shared/github.ts';
import { cachingHeaders, fetchGithub, GithubFailure, rateLimited } from './githubFetch.ts';

const GRAPHQL_URL = `${GITHUB_API_URL}/graphql`;

export interface GraphqlOptions {
  token: string | undefined;
  /** Logins this server will answer for (lowercase). Empty = anyone. Limits how others can spend the token's quota. */
  allowedUsers?: string[];
  fetchImpl?: typeof fetch;
}

/** A function's answer: the JSON body, plus rate-limit details forwarded from GitHub on a 429. */
export interface GraphqlResult<T> {
  status: number;
  body: T | { error: string };
  rateLimitHeaders?: Record<string, string>;
}

/** A validated request for one user. `year` is null for GitHub's default "last year" window. */
export interface UserRequest {
  login: string;
  year: number | null;
  token: string;
  fetchImpl: typeof fetch;
}

/** Options from the environment: Netlify's process.env, or the variables Vite loads locally. */
export function serverOptions(env: Record<string, string | undefined>): GraphqlOptions {
  return { token: env.GITHUB_TOKEN, allowedUsers: parseAllowedUsers(env.CONTRIBUTIONS_ALLOWED_USERS) };
}

/** CONTRIBUTIONS_ALLOWED_USERS="shreeramk,octocat" → ["shreeramk", "octocat"]; unset → [] (anyone). */
export function parseAllowedUsers(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((login) => login.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Reads `?user=<login>&y=last|YYYY` and checks the server can serve it. Throws a GithubFailure (400 bad input,
 * 403 not on the allow-list, 500 no token) before anything is sent to GitHub.
 */
export function readUserRequest(
  params: URLSearchParams,
  { token, allowedUsers = [], fetchImpl = fetch }: GraphqlOptions,
): UserRequest {
  const login = params.get('user') ?? '';
  const period = params.get('y') ?? 'last';
  const year = period === 'last' ? null : Number(period);

  if (!LOGIN_PATTERN.test(login)) throw new GithubFailure(400, 'Invalid user');
  if (year !== null && !(Number.isInteger(year) && year >= FIRST_GITHUB_YEAR && year <= new Date().getUTCFullYear())) {
    throw new GithubFailure(400, 'Invalid year');
  }
  if (allowedUsers.length > 0 && !allowedUsers.includes(login.toLowerCase())) {
    throw new GithubFailure(403, 'This server does not serve that user');
  }
  if (!token) throw new GithubFailure(500, 'GITHUB_TOKEN is not configured on the server');
  return { login, year, token, fetchImpl };
}

/** Jan 1 – Dec 31 of a year, or nothing for GitHub's default "last year" window. */
export function periodVariables(year: number | null): { from?: string; to?: string } {
  return year === null ? {} : { from: `${year}-01-01T00:00:00Z`, to: `${year}-12-31T23:59:59Z` };
}

/**
 * Runs `query` with `$login` (plus `variables`) and returns `data.user`. GitHub's errors become GithubFailures:
 * unknown user 404, rate limit 429, anything unusable 502.
 */
export async function queryUser<T>(
  { login, token, fetchImpl }: UserRequest,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  const response = await fetchGithub(GRAPHQL_URL, {
    token,
    fetchImpl,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { login, ...variables } }),
  });
  if (!response.ok) throw new GithubFailure(502, `GitHub answered ${response.status}`);

  let json: { data?: { user: T | null }; errors?: { type?: string; message: string }[] };
  try {
    json = (await response.json()) as typeof json;
  } catch {
    throw new GithubFailure(502, 'GitHub sent an invalid response');
  }

  if (json.errors?.some((error) => error.type === 'NOT_FOUND') || json.data?.user === null) {
    throw new GithubFailure(404, `GitHub user "${login}" not found`);
  }
  if (json.errors?.some((error) => error.type === 'RATE_LIMITED')) throw rateLimited(response.headers);
  if (!json.data?.user) throw new GithubFailure(502, json.errors?.[0]?.message ?? 'Unexpected response from GitHub');
  return json.data.user;
}

/** Runs a function's work and turns every outcome into a status + JSON body. Never throws. */
export async function respond<T>(work: () => Promise<T>, unexpectedMessage: string): Promise<GraphqlResult<T>> {
  try {
    return { status: 200, body: await work() };
  } catch (error) {
    if (error instanceof GithubFailure) {
      return { status: error.status, body: { error: error.message }, rateLimitHeaders: error.rateLimitHeaders };
    }
    return { status: 500, body: { error: unexpectedMessage } };
  }
}

/** Response headers: successful answers are cached per `varyBy` query parameters; failures forward rate-limit details. */
export function resultHeaders({ status, rateLimitHeaders }: GraphqlResult<unknown>, varyBy: string[]): Record<string, string> {
  return { 'Content-Type': 'application/json', ...cachingHeaders(status, varyBy), ...rateLimitHeaders };
}

export interface HttpResponse {
  status: number;
  body: string;
  headers: Record<string, string>;
}

/** The HTTP response for a result, as both the Netlify Functions and the Vite middleware send it. */
export function toHttpResponse(result: GraphqlResult<unknown>, varyBy: string[]): HttpResponse {
  return { status: result.status, body: JSON.stringify(result.body), headers: resultHeaders(result, varyBy) };
}
