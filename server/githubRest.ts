// Server-side only: forwards the page's read-only GitHub REST calls with the server token. Called from the browser,
// GitHub allows 60 requests per hour per IP, which one busy visitor (or office network) can use up. Through this
// function visitors share the token's 5,000 per hour, and Netlify's CDN answers repeat requests itself.
// Runs in the Netlify Function (netlify/functions/github.mts) and in the Vite dev/preview middleware (vite.config.ts).
import { GITHUB_API_URL, LOGIN_PATTERN_SOURCE } from '../shared/github.ts';
import { cachingHeaders, fetchGithub, GithubFailure } from './githubFetch.ts';

const REPO_NAME = '[\\w.-]{1,100}';
/** The endpoints the page uses. Anything else is refused, so the token can't be used for other requests. */
const ALLOWED_PATHS = [
  new RegExp(`^/users/${LOGIN_PATTERN_SOURCE}(?:/(?:repos|social_accounts|orgs|starred))?$`, 'i'),
  new RegExp(`^/repos/${LOGIN_PATTERN_SOURCE}/${REPO_NAME}$`, 'i'),
];
const ALLOWED_QUERY_NAMES = new Set(['per_page', 'page', 'sort']);
const QUERY_VALUE = /^\w{1,20}$/;

export interface RestResult {
  status: number;
  /** GitHub's JSON as is, or `{ "error": … }` */
  body: string;
  headers: Record<string, string>;
}

export interface RestOptions {
  token: string | undefined;
  fetchImpl?: typeof fetch;
}

/**
 * Handles `?path=<REST path>`, e.g. `/users/shreeramk/repos?per_page=100&sort=updated`. GitHub's 200 and 404 answers
 * are passed through. Never throws: every other outcome is an error status with a JSON body.
 */
export async function getGithubRest(path: string, options: RestOptions): Promise<RestResult> {
  try {
    return await forward(path, options);
  } catch (error) {
    const failure = error instanceof GithubFailure ? error : new GithubFailure(500, 'Unexpected error while calling GitHub');
    return {
      status: failure.status,
      body: JSON.stringify({ error: failure.message }),
      headers: { 'Content-Type': 'application/json', ...cachingHeaders(failure.status, []), ...failure.rateLimitHeaders },
    };
  }
}

async function forward(path: string, { token, fetchImpl = fetch }: RestOptions): Promise<RestResult> {
  // Parsed against the API origin, so "//other.host/…" or a full URL fails the origin check
  const url = path.startsWith('/') ? new URL(path, GITHUB_API_URL) : null;
  const allowed =
    url !== null &&
    url.origin === GITHUB_API_URL &&
    ALLOWED_PATHS.some((pattern) => pattern.test(url.pathname)) &&
    [...url.searchParams].every(([name, value]) => ALLOWED_QUERY_NAMES.has(name) && QUERY_VALUE.test(value));
  if (!allowed) throw new GithubFailure(400, 'This GitHub path is not served here');
  if (!token) throw new GithubFailure(500, 'GITHUB_TOKEN is not configured on the server');

  const response = await fetchGithub(url.href, { token, fetchImpl, headers: { Accept: 'application/vnd.github+json' } });
  if (response.status !== 200 && response.status !== 404) throw new GithubFailure(502, `GitHub answered ${response.status}`);

  const headers: Record<string, string> = {
    'Content-Type': response.headers.get('content-type') ?? 'application/json',
    ...cachingHeaders(response.status, ['path']),
  };
  // The Stars counter reads the last page number from the Link header.
  const link = response.headers.get('link');
  if (link) headers.Link = link;
  return { status: response.status, body: await response.text(), headers };
}
