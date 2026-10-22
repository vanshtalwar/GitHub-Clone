import { describe, expect, it, vi } from 'vitest';
import { githubPath, jsonResponse, stubFetch } from '../test/http';
import { getStarredCount, getUser, parseLastPage } from './github';
import { NetworkError, NotFoundError, RateLimitError } from './http';

describe('parseLastPage', () => {
  it('reads the last page from a GitHub Link header', () => {
    const link =
      '<https://api.github.com/user/5489153/starred?per_page=1&page=2>; rel="next", ' +
      '<https://api.github.com/user/5489153/starred?per_page=1&page=5>; rel="last"';
    expect(parseLastPage(link)).toBe(5);
  });

  it('returns undefined without a header or a rel="last" link', () => {
    expect(parseLastPage(null)).toBeUndefined();
    expect(parseLastPage('<https://api.github.com/x?page=1>; rel="prev"')).toBeUndefined();
  });
});

describe('getStarredCount', () => {
  it('uses the Link header when there is more than one page', async () => {
    stubFetch(() =>
      jsonResponse([{}], { headers: { Link: '<https://api.github.com/user/1/starred?per_page=1&page=12>; rel="last"' } }),
    );
    await expect(getStarredCount('octo')).resolves.toBe(12);
  });

  it('falls back to the body length when everything fits on one page', async () => {
    stubFetch(() => jsonResponse([]));
    await expect(getStarredCount('octo')).resolves.toBe(0);
  });
});

describe('getUser', () => {
  const apiUser = {
    login: 'octo',
    name: 'Octo Cat',
    avatar_url: 'https://avatars.example/octo',
    html_url: 'https://github.com/octo',
    bio: null,
    company: '@github',
    blog: '',
    location: null,
    email: null,
    twitter_username: null,
    public_repos: 8,
    followers: 100,
    following: 1,
    created_at: '2011-01-25T18:44:36Z',
  };

  it('maps the API response and caches it', async () => {
    const fetchMock = stubFetch((url) => (githubPath(url) === '/users/octo' ? jsonResponse(apiUser) : undefined));

    const user = await getUser('octo');
    expect(user).toMatchObject({ login: 'octo', avatarUrl: 'https://avatars.example/octo', publicRepos: 8 });

    await getUser('OCTO'); // logins are case-insensitive, so this is a cache hit
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('asks the site’s GitHub function, which adds the server token', async () => {
    const fetchMock = stubFetch(() => jsonResponse(apiUser));
    await getUser('octo');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/.netlify/functions/github?path=%2Fusers%2Focto', expect.anything());
  });

  it('asks GitHub directly when the function can’t answer', async () => {
    const fetchMock = stubFetch((url) =>
      url.startsWith('https://api.github.com/')
        ? jsonResponse(apiUser)
        : jsonResponse({ error: 'GITHUB_TOKEN is not configured on the server' }, { status: 500 }),
    );
    await expect(getUser('octo')).resolves.toMatchObject({ login: 'octo' });
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      '/.netlify/functions/github?path=%2Fusers%2Focto',
      'https://api.github.com/users/octo',
    ]);
  });

  it('throws NotFoundError for a 404 without asking again: the user doesn’t exist', async () => {
    const fetchMock = stubFetch(() => jsonResponse({ message: 'Not Found' }, { status: 404 }));
    await expect(getUser('nobody')).rejects.toBeInstanceOf(NotFoundError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws RateLimitError when the limit is used up', async () => {
    stubFetch(() =>
      jsonResponse(
        { message: 'API rate limit exceeded' },
        { status: 403, headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1792662328', 'x-ratelimit-limit': '60' } },
      ),
    );
    const error = await getUser('octo').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).resetAt).toEqual(new Date(1792662328 * 1000));
    expect((error as RateLimitError).limit).toBe(60);
  });

  it('times out instead of waiting forever', async () => {
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init: RequestInit) => {
        signal = init.signal ?? undefined;
        return Promise.reject(new DOMException('The operation timed out.', 'TimeoutError'));
      }),
    );
    await expect(getUser('octo')).rejects.toThrow('timed out');
    expect(signal).toBeInstanceOf(AbortSignal);
  });

  it('throws NetworkError when the request fails', async () => {
    // setup.ts makes every fetch reject by default
    await expect(getUser('octo')).rejects.toBeInstanceOf(NetworkError);
  });
});
