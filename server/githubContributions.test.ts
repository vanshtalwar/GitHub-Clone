import { describe, expect, it, vi } from 'vitest';
import {
  CONTRIBUTIONS_QUERY,
  contributionsHeaders,
  getContributionCalendar,
  parseAllowedUsers,
} from './githubContributions.ts';

function graphqlResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

const calendarBody = {
  data: {
    user: {
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: 2186,
          weeks: [
            {
              contributionDays: [
                { date: '2025-10-20', contributionCount: 6, contributionLevel: 'FOURTH_QUARTILE' },
                { date: '2025-10-19', contributionCount: 0, contributionLevel: 'NONE' },
              ],
            },
            { contributionDays: [{ date: '2025-10-26', contributionCount: 2, contributionLevel: 'FIRST_QUARTILE' }] },
          ],
        },
      },
    },
  },
};

const params = (query: string) => new URLSearchParams(query);
const call = (query: string, fetchImpl: typeof fetch, extra: { token?: string; allowedUsers?: string[] } = {}) =>
  getContributionCalendar(params(query), { token: 'token', fetchImpl, ...extra });

describe('getContributionCalendar', () => {
  it('queries GitHub GraphQL with the server token and maps the calendar', async () => {
    const fetchMock = vi.fn(async () => graphqlResponse(calendarBody));
    const result = await call('user=shreeramk&y=last', fetchMock, { token: 'secret-token' });

    expect(fetchMock).toHaveBeenCalledWith('https://api.github.com/graphql', expect.objectContaining({ method: 'POST' }));
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('bearer secret-token');
    expect(init.signal).toBeInstanceOf(AbortSignal); // never waits forever on GitHub
    expect(JSON.parse(init.body as string)).toEqual({ query: CONTRIBUTIONS_QUERY, variables: { login: 'shreeramk' } });

    expect(result).toEqual({
      status: 200,
      body: {
        total: 2186,
        from: '2025-10-19',
        to: '2025-10-26',
        days: [
          { date: '2025-10-19', count: 0, level: 0 },
          { date: '2025-10-20', count: 6, level: 4 },
          { date: '2025-10-26', count: 2, level: 1 },
        ],
      },
    });
  });

  it('asks for Jan 1 – Dec 31 when a year is given', async () => {
    const fetchMock = vi.fn(async () => graphqlResponse(calendarBody));
    await call('user=shreeramk&y=2019', fetchMock);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string).variables).toEqual({
      login: 'shreeramk',
      from: '2019-01-01T00:00:00Z',
      to: '2019-12-31T23:59:59Z',
    });
  });

  it('rejects bad input before calling GitHub', async () => {
    const fetchMock = vi.fn();
    expect((await call('user=not a user', fetchMock)).status).toBe(400);
    expect((await call('user=octo&y=1999', fetchMock)).status).toBe(400);
    expect((await call('user=octo&y=abc', fetchMock)).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('only serves allowed users when an allow-list is configured', async () => {
    const fetchMock = vi.fn(async () => graphqlResponse(calendarBody));
    expect((await call('user=octo', fetchMock, { allowedUsers: ['shreeramk'] })).status).toBe(403);
    expect((await call('user=ShreeramK', fetchMock, { allowedUsers: ['shreeramk'] })).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports a missing or rejected token as a server error', async () => {
    expect((await call('user=octo', vi.fn(), { token: undefined })).status).toBe(500);
    const rejected = await call('user=octo', vi.fn(async () => graphqlResponse({}, 401)));
    expect(rejected).toEqual({ status: 500, body: { error: 'GitHub rejected the server token' } });
  });

  it('maps an unknown user to 404', async () => {
    const notFound = {
      data: { user: null },
      errors: [{ type: 'NOT_FOUND', message: "Could not resolve to a User with the login of 'nobody'." }],
    };
    expect((await call('user=nobody', vi.fn(async () => graphqlResponse(notFound)))).status).toBe(404);
  });

  it('treats only real rate limits as 429 and forwards when they reset', async () => {
    const limited = await call(
      'user=octo',
      vi.fn(async () =>
        graphqlResponse({}, 403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1792662328', 'x-ratelimit-limit': '5000' }),
      ),
    );
    expect(limited.status).toBe(429);
    expect(limited.rateLimitHeaders).toEqual({ 'x-ratelimit-limit': '5000', 'x-ratelimit-reset': '1792662328' });
    expect(contributionsHeaders(limited)).toMatchObject({ 'x-ratelimit-reset': '1792662328', 'Cache-Control': 'no-store' });

    // Any other 403 (e.g. a token without access) is not a rate limit
    const refused = await call('user=octo', vi.fn(async () => graphqlResponse({ message: 'Resource not accessible' }, 403)));
    expect(refused).toEqual({ status: 502, body: { error: 'GitHub answered 403' } });

    const graphqlLimited = await call(
      'user=octo',
      vi.fn(async () => graphqlResponse({ errors: [{ type: 'RATE_LIMITED', message: 'API rate limit exceeded' }] })),
    );
    expect(graphqlLimited.status).toBe(429);
  });

  it('answers 502 for unreachable GitHub and 504 when it times out', async () => {
    expect((await call('user=octo', vi.fn(async () => Promise.reject(new TypeError('offline'))))).status).toBe(502);
    const timeout = new DOMException('The operation timed out.', 'TimeoutError');
    expect(await call('user=octo', vi.fn(async () => Promise.reject(timeout)))).toEqual({
      status: 504,
      body: { error: 'GitHub did not answer in time' },
    });
  });

  it('never throws: an invalid or unexpected response becomes an error status', async () => {
    const html = await call('user=octo', vi.fn(async () => graphqlResponse('<html>GitHub is having trouble</html>')));
    expect(html).toEqual({ status: 502, body: { error: 'GitHub sent an invalid response' } });

    const malformed = { data: { user: { contributionsCollection: { contributionCalendar: { totalContributions: 1, weeks: null } } } } };
    await expect(call('user=octo', vi.fn(async () => graphqlResponse(malformed)))).resolves.toEqual({
      status: 500,
      body: { error: 'Unexpected error while loading contributions' },
    });
  });
});

describe('contributionsHeaders / parseAllowedUsers', () => {
  it('caches successful calendars and nothing else', () => {
    expect(contributionsHeaders({ status: 200, body: { total: 0, days: [], from: '', to: '' } })['Netlify-CDN-Cache-Control']).toContain(
      's-maxage=3600',
    );
    expect(contributionsHeaders({ status: 404, body: { error: 'x' } })).toEqual({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    });
  });

  it('reads the allow-list from a comma-separated variable', () => {
    expect(parseAllowedUsers(' ShreeramK, octocat ,')).toEqual(['shreeramk', 'octocat']);
    expect(parseAllowedUsers(undefined)).toEqual([]);
  });
});
