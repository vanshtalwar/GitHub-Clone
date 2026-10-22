import { describe, expect, it, vi } from 'vitest';
import { getActivity, timelineMonths, toMonth, toOverview } from './githubActivity.ts';

function graphqlResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const repo = (nameWithOwner: string, owner: 'User' | 'Organization' = 'User') => ({
  nameWithOwner,
  owner: { __typename: owner, login: nameWithOwner.split('/')[0], avatarUrl: `https://avatars.example/${nameWithOwner.split('/')[0]}` },
});

const overviewCollection = {
  totalCommitContributions: 83,
  totalIssueContributions: 0,
  totalPullRequestContributions: 17,
  totalPullRequestReviewContributions: 0,
  commitContributionsByRepository: [
    { repository: repo('UptimeAI/uptime_webapp', 'Organization'), contributions: { totalCount: 40 } },
    { repository: repo('octo/dotfiles'), contributions: { totalCount: 30 } },
    { repository: repo('timescale/timescaledb', 'Organization'), contributions: { totalCount: 5 } },
    { repository: repo('UptimeAI/uptime_ml', 'Organization'), contributions: { totalCount: 8 } },
  ],
  issueContributionsByRepository: [],
  pullRequestContributionsByRepository: [
    { repository: repo('timescale/timescaledb', 'Organization'), contributions: { totalCount: 17 } },
  ],
  pullRequestReviewContributionsByRepository: [],
};

const emptyMonth = { restrictedContributionsCount: 0, commitContributionsByRepository: [], pullRequestContributionsByRepository: [] };

describe('timelineMonths', () => {
  it('counts back twelve months from this month for "last year"', () => {
    const months = timelineMonths(null, new Date('2026-10-22T12:00:00Z'));
    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ monthsAgo: 0, month: '2026-10', from: '2026-10-01T00:00:00.000Z', to: '2026-10-31T23:59:59.000Z' });
    expect(months[11].month).toBe('2025-11');
  });

  it('covers December back to January for a past year', () => {
    const months = timelineMonths(2019);
    expect(months.map((month) => month.month)).toEqual([
      '2019-12', '2019-11', '2019-10', '2019-09', '2019-08', '2019-07',
      '2019-06', '2019-05', '2019-04', '2019-03', '2019-02', '2019-01',
    ]);
    expect(months[10]).toMatchObject({ from: '2019-02-01T00:00:00.000Z', to: '2019-02-28T23:59:59.000Z' });
  });
});

describe('toOverview', () => {
  it('turns totals into percentages and ranks repositories by all their contributions', () => {
    expect(toOverview(overviewCollection)).toEqual({
      // timescaledb: 5 commits + 17 pull requests = 22, ahead of uptime_ml's 8
      contributedTo: ['UptimeAI/uptime_webapp', 'octo/dotfiles', 'timescale/timescaledb'],
      otherRepoCount: 1,
      orgs: [
        { login: 'UptimeAI', avatarUrl: 'https://avatars.example/UptimeAI' },
        { login: 'timescale', avatarUrl: 'https://avatars.example/timescale' },
      ],
      breakdown: { commits: 83, pullRequests: 17, issues: 0, codeReview: 0 },
    });
  });

  it('handles a period without public contributions', () => {
    const empty = { ...overviewCollection, totalCommitContributions: 0, totalPullRequestContributions: 0, commitContributionsByRepository: [], pullRequestContributionsByRepository: [] };
    expect(toOverview(empty)).toEqual({
      orgs: [],
      contributedTo: [],
      otherRepoCount: 0,
      breakdown: { commits: 0, pullRequests: 0, issues: 0, codeReview: 0 },
    });
  });
});

describe('toMonth', () => {
  const range = { monthsAgo: 2, month: '2026-08', from: '', to: '' };

  it('lists commits per repo, pull requests per repo by state, and the private count', () => {
    const month = toMonth(range, {
      restrictedContributionsCount: 166,
      commitContributionsByRepository: [{ repository: { nameWithOwner: 'octo/a' }, contributions: { totalCount: 12 } }],
      pullRequestContributionsByRepository: [
        {
          repository: { nameWithOwner: 'octo/a' },
          contributions: {
            nodes: [{ pullRequest: { state: 'MERGED' } }, { pullRequest: { state: 'MERGED' } }, { pullRequest: { state: 'OPEN' } }, { pullRequest: { state: 'CLOSED' } }, null],
          },
        },
      ],
    });
    expect(month).toEqual({
      monthsAgo: 2,
      month: '2026-08',
      items: [
        { kind: 'commits', repos: [{ name: 'octo/a', count: 12 }] },
        { kind: 'pullRequests', repos: [{ name: 'octo/a', merged: 2, open: 1, closed: 1 }] },
        { kind: 'private', count: 166 },
      ],
    });
  });

  it('has no items for a month without activity', () => {
    expect(toMonth(range, emptyMonth).items).toEqual([]);
    expect(toMonth(range, undefined).items).toEqual([]);
  });
});

describe('getActivity', () => {
  /** Answers the overview query and each months query (aliases m0…m11) like GitHub. */
  function fakeGithub() {
    return vi.fn(async (_url: string, init: RequestInit) => {
      const { query } = JSON.parse(init.body as string) as { query: string };
      if (query.includes('totalCommitContributions')) return graphqlResponse({ data: { user: { contributionsCollection: overviewCollection } } });
      const aliases = [...query.matchAll(/(m\d+): contributionsCollection/g)].map((match) => match[1]);
      const user = Object.fromEntries(
        aliases.map((alias) => [
          alias,
          alias === 'm0'
            ? { ...emptyMonth, commitContributionsByRepository: [{ repository: { nameWithOwner: 'octo/a' }, contributions: { totalCount: 3 } }] }
            : emptyMonth,
        ]),
      );
      return graphqlResponse({ data: { user } });
    });
  }

  it('queries the overview and the months in parallel and leaves out empty months', async () => {
    const fetchMock = fakeGithub();
    const result = await getActivity(new URLSearchParams('user=octo&y=2019'), { token: 'token', fetchImpl: fetchMock as typeof fetch });

    expect(fetchMock).toHaveBeenCalledTimes(4); // overview + 3 batches of 4 months
    const overviewCall = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(overviewCall.variables).toEqual({ login: 'octo', from: '2019-01-01T00:00:00Z', to: '2019-12-31T23:59:59Z' });
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({
      overview: { contributedTo: ['UptimeAI/uptime_webapp', 'octo/dotfiles', 'timescale/timescaledb'] },
      months: [{ monthsAgo: 0, month: '2019-12', items: [{ kind: 'commits', repos: [{ name: 'octo/a', count: 3 }] }] }],
    });
  });

  it('validates input and reports GitHub errors like the other functions', async () => {
    const fetchMock = vi.fn();
    expect((await getActivity(new URLSearchParams('user=not a user'), { token: 'token', fetchImpl: fetchMock })).status).toBe(400);
    expect((await getActivity(new URLSearchParams('user=octo'), { token: undefined, fetchImpl: fetchMock })).status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();

    const notFound = vi.fn(async () => graphqlResponse({ data: { user: null }, errors: [{ type: 'NOT_FOUND', message: 'x' }] }));
    expect((await getActivity(new URLSearchParams('user=github'), { token: 'token', fetchImpl: notFound })).status).toBe(404);
  });
});
