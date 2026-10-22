// Server-side only: what the functions that call GitHub with the server token have in common
// (githubContributions.ts for GraphQL, githubRest.ts for REST). The token never leaves the server.

const USER_AGENT = 'github-profile-assignment';
/** Fail before Netlify's own function timeout (10 s) so the client gets a proper answer. */
const GITHUB_TIMEOUT_MS = 8_000;

/** A failure to report to the browser as is: a status, an error message and any rate-limit details. */
export class GithubFailure extends Error {
  readonly status: number;
  /** Rate-limit details forwarded from GitHub (x-ratelimit-*), so the browser can say when to retry. */
  readonly rateLimitHeaders: Record<string, string> | undefined;

  constructor(status: number, message: string, rateLimitHeaders?: Record<string, string>) {
    super(message);
    this.status = status;
    this.rateLimitHeaders = rateLimitHeaders;
  }
}

export interface GithubRequest {
  token: string;
  fetchImpl: typeof fetch;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

/**
 * Calls GitHub with the server token and a timeout. Returns GitHub's response, or throws a GithubFailure when GitHub
 * can't be reached, rejects the token, or is rate limiting it.
 */
export async function fetchGithub(url: string, { token, fetchImpl, headers, ...init }: GithubRequest): Promise<Response> {
  let response: Response;
  try {
    response = await fetchImpl(url, {
      ...init,
      headers: { Authorization: `bearer ${token}`, 'User-Agent': USER_AGENT, ...headers },
      signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
    throw timedOut ? new GithubFailure(504, 'GitHub did not answer in time') : new GithubFailure(502, 'GitHub could not be reached');
  }

  if (response.status === 401) throw new GithubFailure(500, 'GitHub rejected the server token');
  if (isRateLimited(response)) throw rateLimited(response.headers);
  return response;
}

export function rateLimited(headers: Headers): GithubFailure {
  const forwarded: Record<string, string> = {};
  for (const name of ['x-ratelimit-limit', 'x-ratelimit-reset', 'retry-after']) {
    const value = headers.get(name);
    if (value) forwarded[name] = value;
  }
  return new GithubFailure(429, 'GitHub rate limit reached', forwarded);
}

/** Only real rate limits: GitHub also answers 403 for other refusals (e.g. a token without access). */
function isRateLimited({ status, headers }: Response): boolean {
  if (status === 429) return true;
  return status === 403 && (headers.get('x-ratelimit-remaining') === '0' || headers.has('retry-after'));
}

/**
 * Successful answers are cached 5 min in the browser and 1 h on Netlify's CDN, keyed on the `varyBy` query
 * parameters; nothing else is cached.
 */
export function cachingHeaders(status: number, varyBy: string[]): Record<string, string> {
  return status === 200
    ? {
        'Cache-Control': 'public, max-age=300',
        'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=3600, stale-while-revalidate=86400',
        'Netlify-Vary': `query=${varyBy.join('|')}`,
      }
    : { 'Cache-Control': 'no-store' };
}
