// Why live data couldn't be loaded, summarised for the UI (banner, error page, Stars tab).
import { formatCount, formatTime } from '../utils/format';
import { RateLimitError } from './http';

export interface LoadFailure {
  rateLimited: boolean;
  /** When GitHub's rate limit resets, if known. */
  resetAt?: Date;
  /** The hourly limit that was hit (60 for visitors, 5,000 for a token), if known. */
  limit?: number;
}

/** Summarises one or more failed requests; a rate limit wins because it's the actionable cause. */
export function describeFailure(errors: unknown[]): LoadFailure {
  const rateLimit = errors.find((error): error is RateLimitError => error instanceof RateLimitError);
  return rateLimit ? { rateLimited: true, resetAt: rateLimit.resetAt, limit: rateLimit.limit } : { rateLimited: false };
}

/** One sentence explaining a failure. */
export function describeLoadFailure(failure: LoadFailure): string {
  if (!failure.rateLimited) return "GitHub's API couldn't be reached.";
  const limit = failure.limit ? ` (${formatCount(failure.limit)} requests per hour)` : '';
  const retry = failure.resetAt ? `try again after ${formatTime(failure.resetAt)}` : 'try again later';
  return `GitHub's API rate limit${limit} has been reached; ${retry}.`;
}
