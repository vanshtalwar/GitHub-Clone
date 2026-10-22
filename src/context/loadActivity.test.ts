import { describe, expect, it } from 'vitest';
import { mockActivity } from '../mocks/activity';
import { jsonResponse, stubFetch } from '../test/http';
import type { ActivityData } from '../types/activity';
import { hasPublicActivity, loadActivity } from './loadActivity';

const publicActivity: ActivityData = {
  overview: { orgs: [], contributedTo: ['octo/tool'], otherRepoCount: 0, breakdown: { commits: 100, pullRequests: 0, issues: 0, codeReview: 0 } },
  months: [{ monthsAgo: 0, month: '2026-10', items: [{ kind: 'commits', repos: [{ name: 'octo/tool', count: 4 }] }] }],
};

/** What GitHub returns for shreeramk: every contribution is in a private repository. */
const privateOnly: ActivityData = {
  overview: { orgs: [], contributedTo: [], otherRepoCount: 0, breakdown: { commits: 0, pullRequests: 0, issues: 0, codeReview: 0 } },
  months: [{ monthsAgo: 0, month: '2026-10', items: [{ kind: 'private', count: 166 }] }],
};

describe('loadActivity', () => {
  it('returns live activity and asks for the period', async () => {
    const fetchMock = stubFetch(() => jsonResponse(publicActivity));
    await expect(loadActivity('Octo', 2019)).resolves.toEqual({ status: 'ready', activity: publicActivity, source: 'live' });
    expect(fetchMock).toHaveBeenCalledWith('/.netlify/functions/activity?user=octo&y=2019', expect.anything());
  });

  it('keeps live private-only activity for other users (the timeline shows the private count)', async () => {
    stubFetch(() => jsonResponse(privateOnly));
    await expect(loadActivity('octo', 'last')).resolves.toMatchObject({ activity: privateOnly, source: 'live' });
  });

  it('shows the design’s activity for shreeramk, whose activity GitHub only details to the owner', async () => {
    stubFetch(() => jsonResponse(privateOnly));
    await expect(loadActivity('shreeramk', 'last')).resolves.toEqual({ status: 'ready', activity: mockActivity, source: 'mock' });
  });

  it('uses live activity for shreeramk too once there is public activity', async () => {
    stubFetch(() => jsonResponse(publicActivity));
    await expect(loadActivity('shreeramk', 'last')).resolves.toMatchObject({ source: 'live' });
  });

  it('falls back to the sample for shreeramk, and reports an error for others, when the API fails', async () => {
    // setup.ts makes every fetch reject by default
    await expect(loadActivity('shreeramk', 'last')).resolves.toEqual({
      status: 'ready',
      activity: mockActivity,
      source: 'mock',
      failure: { rateLimited: false },
    });
    await expect(loadActivity('octo', 'last')).resolves.toEqual({ status: 'error', failure: { rateLimited: false } });
  });

  it('shows no activity, not an error, for a login GraphQL doesn’t know as a user (an organization)', async () => {
    stubFetch(() => jsonResponse({ error: 'GitHub user "github" not found' }, { status: 404 }));
    await expect(loadActivity('github', 'last')).resolves.toMatchObject({ status: 'ready', activity: { months: [] }, source: 'live' });
  });
});

describe('hasPublicActivity', () => {
  it('is false when there is only a count of private contributions', () => {
    expect(hasPublicActivity(privateOnly)).toBe(false);
    expect(hasPublicActivity(publicActivity)).toBe(true);
  });
});
