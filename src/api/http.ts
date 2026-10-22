// fetch wrapper shared by the API clients. Turns HTTP failures into typed errors so callers can tell
// "this user doesn't exist" (show Not Found) from "try again later" (fall back to mock data).
// User-facing summaries of these errors live in failure.ts.
import { REQUEST_TIMEOUT_MS } from '../config';

export class ApiError extends Error {
  name = 'ApiError';
}

export class NotFoundError extends ApiError {
  name = 'NotFoundError';
}

export class RateLimitError extends ApiError {
  name = 'RateLimitError';
  /** When the limit resets, if the API said so. */
  readonly resetAt: Date | undefined;
  /** Requests per hour allowed by the limit that was hit (60 for visitors, 5,000 for a token), if known. */
  readonly limit: number | undefined;

  constructor(message: string, { resetAt, limit }: { resetAt?: Date; limit?: number } = {}) {
    super(message);
    this.resetAt = resetAt;
    this.limit = limit;
  }
}

/** The request didn't complete in time, or the server answered with an unexpected status. */
export class NetworkError extends ApiError {
  name = 'NetworkError';
}

export interface JsonResponse<T> {
  data: T;
  headers: Headers;
}

export async function fetchJson<T>(
  url: string,
  { accept = 'application/json', timeoutMs = REQUEST_TIMEOUT_MS }: { accept?: string; timeoutMs?: number } = {},
): Promise<JsonResponse<T>> {
  let response: Response;
  try {
    // Accept is a CORS-safelisted header, so this stays a "simple" request with no preflight.
    // The timeout guarantees the promise settles: cache.ts shares in-flight requests, so a hung one would block
    // every caller of that key until a reload.
    response = await fetch(url, { headers: { Accept: accept }, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError';
    throw new NetworkError(`Request to ${url} ${timedOut ? 'timed out' : 'failed'}`, { cause: error });
  }

  if (response.status === 404) {
    throw new NotFoundError(`Not found: ${url}`);
  }
  if (isRateLimited(response)) {
    throw new RateLimitError(`Rate limit reached: ${url}`, {
      resetAt: resetTime(response.headers),
      limit: Number(response.headers.get('x-ratelimit-limit')) || undefined,
    });
  }
  if (!response.ok) {
    throw new NetworkError(`HTTP ${response.status} from ${url}`);
  }

  try {
    return { data: (await response.json()) as T, headers: response.headers };
  } catch (error) {
    throw new NetworkError(`Invalid JSON from ${url}`, { cause: error });
  }
}

function isRateLimited({ status, headers }: Response): boolean {
  if (status === 429) return true;
  // GitHub uses 403 for both the primary limit (remaining = 0) and secondary limits (Retry-After).
  return status === 403 && (headers.get('x-ratelimit-remaining') === '0' || headers.has('retry-after'));
}

function resetTime(headers: Headers): Date | undefined {
  const reset = Number(headers.get('x-ratelimit-reset'));
  return reset > 0 ? new Date(reset * 1000) : undefined;
}
