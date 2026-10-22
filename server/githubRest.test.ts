import { describe, expect, it, vi } from 'vitest';
import { getGithubRest } from './githubRest.ts';

function githubResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

const call = (path: string, fetchImpl: typeof fetch) => getGithubRest(path, { token: 'secret-token', fetchImpl });

describe('getGithubRest', () => {
  it('forwards an allowed request with the server token and passes the answer through', async () => {
    const link = '<https://api.github.com/user/1/starred?per_page=1&page=7>; rel="last"';
    const fetchMock = vi.fn(async () => githubResponse([{ id: 1 }], 200, { Link: link }));

    const result = await call('/users/shreeramk/starred?per_page=1', fetchMock);

    expect(fetchMock).toHaveBeenCalledWith('https://api.github.com/users/shreeramk/starred?per_page=1', expect.anything());
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe('bearer secret-token');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(result.status).toBe(200);
    expect(JSON.parse(result.body)).toEqual([{ id: 1 }]);
    expect(result.headers).toMatchObject({
      'Content-Type': 'application/json; charset=utf-8',
      Link: link, // the Stars counter needs it
      'Netlify-Vary': 'query=path',
      'Cache-Control': 'public, max-age=300',
    });
  });

  it.each([
    '/users/shreeramk',
    '/users/shreeramk/repos?per_page=100&sort=updated',
    '/users/shreeramk/social_accounts',
    '/users/shreeramk/orgs',
    '/repos/shreeramk/dotfiles.vim',
  ])('serves %s', async (path) => {
    const fetchMock = vi.fn(async () => githubResponse({}));
    expect((await call(path, fetchMock)).status).toBe(200);
  });

  it('passes GitHub’s 404 through without caching it', async () => {
    const result = await call('/users/no-such-user', vi.fn(async () => githubResponse({ message: 'Not Found' }, 404)));
    expect(result.status).toBe(404);
    expect(result.headers['Cache-Control']).toBe('no-store');
  });

  it.each([
    'users/shreeramk', // not a path
    '/users/shreeramk/events', // an endpoint the page doesn't use
    '/orgs/github/members',
    '/users/shreeramk/../../orgs/github', // normalised to /orgs/github
    '/graphql',
    '/users/shreeramk/repos?type=all', // a query parameter the page doesn't send
    '/users/shreeramk/repos?per_page=1%26x',
    '//evil.example/users/shreeramk', // another host
    'https://evil.example/users/shreeramk',
    '',
  ])('refuses %j without calling GitHub', async (path) => {
    const fetchMock = vi.fn();
    const result = await call(path, fetchMock);
    expect(result.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports a missing or rejected token as a server error', async () => {
    const fetchMock = vi.fn(async () => githubResponse({ message: 'Bad credentials' }, 401));
    const withoutToken = await getGithubRest('/users/octo', { token: undefined, fetchImpl: fetchMock });
    expect(withoutToken).toMatchObject({ status: 500, body: '{"error":"GITHUB_TOKEN is not configured on the server"}' });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await call('/users/octo', fetchMock)).toMatchObject({ status: 500, body: '{"error":"GitHub rejected the server token"}' });
  });

  it('answers 429 with GitHub’s reset time for a real rate limit, and 502 for other refusals', async () => {
    const limited = githubResponse({}, 403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1792662328', 'x-ratelimit-limit': '5000' });
    const result = await call('/users/octo', vi.fn(async () => limited));
    expect(result.status).toBe(429);
    expect(result.headers).toMatchObject({ 'x-ratelimit-reset': '1792662328', 'x-ratelimit-limit': '5000', 'Cache-Control': 'no-store' });

    expect((await call('/users/octo', vi.fn(async () => githubResponse({}, 403)))).status).toBe(502);
    expect((await call('/users/octo', vi.fn(async () => githubResponse({}, 500)))).status).toBe(502);
  });

  it('answers 502 for unreachable GitHub and 504 when it times out', async () => {
    expect((await call('/users/octo', vi.fn().mockRejectedValue(new TypeError('fetch failed')))).status).toBe(502);
    const timeout = new DOMException('The operation timed out.', 'TimeoutError');
    expect((await call('/users/octo', vi.fn().mockRejectedValue(timeout))).status).toBe(504);
  });

  it('never throws: an unexpected failure becomes a 500', async () => {
    const broken = { status: 200, ok: true, headers: new Headers(), text: () => Promise.reject(new Error('boom')) };
    const result = await call('/users/octo', vi.fn(async () => broken as unknown as Response));
    expect(result).toMatchObject({ status: 500, headers: { 'Content-Type': 'application/json' } });
  });
});
