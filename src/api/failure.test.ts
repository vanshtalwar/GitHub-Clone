import { describe, expect, it } from 'vitest';
import { describeFailure, describeLoadFailure } from './failure';
import { NetworkError, RateLimitError } from './http';

describe('describeFailure', () => {
  it('prefers a rate limit, keeping its reset time and limit', () => {
    const resetAt = new Date(2026, 9, 22, 16, 15);
    expect(describeFailure([new NetworkError('x'), new RateLimitError('y', { resetAt, limit: 60 })])).toEqual({
      rateLimited: true,
      resetAt,
      limit: 60,
    });
    expect(describeFailure([new NetworkError('x')])).toEqual({ rateLimited: false });
  });
});

describe('describeLoadFailure', () => {
  it('names the real limit and when to retry', () => {
    expect(describeLoadFailure({ rateLimited: true, limit: 5000, resetAt: new Date(2026, 9, 22, 16, 15) })).toBe(
      "GitHub's API rate limit (5,000 requests per hour) has been reached; try again after 4:15 PM.",
    );
    expect(describeLoadFailure({ rateLimited: true })).toBe("GitHub's API rate limit has been reached; try again later.");
    expect(describeLoadFailure({ rateLimited: false })).toBe("GitHub's API couldn't be reached.");
  });
});
