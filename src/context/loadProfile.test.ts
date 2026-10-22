import { describe, expect, it } from 'vitest';
import { mockExtras, mockOrgs, mockRepos, mockUser } from '../mocks/profile';
import { githubPath, jsonResponse, stubFetch } from '../test/http';
import type { Repo } from '../types/github';
import { forksNeedingParents, loadForkParents, loadProfile, withForkParents } from './loadProfile';

function apiUser(login: string) {
  return {
    login,
    name: 'Octo Cat',
    avatar_url: `https://avatars.example/${login}`,
    html_url: `https://github.com/${login}`,
    bio: 'Hi @github',
    company: 'GitHub',
    blog: 'https://octo.example',
    location: 'SF',
    email: null,
    twitter_username: null,
    public_repos: 1,
    followers: 10,
    following: 2,
    created_at: '2011-01-25T18:44:36Z',
  };
}

function apiFork(login: string) {
  return {
    name: 'tool',
    full_name: `${login}/tool`,
    html_url: `https://github.com/${login}/tool`,
    description: 'A fork',
    private: false,
    visibility: 'public',
    fork: true,
    language: null,
    stargazers_count: 0,
    forks_count: 0,
    created_at: '2020-01-01T00:00:00Z',
    updated_at: '2020-01-01T00:00:00Z',
  };
}

/** A working GitHub API for one user. */
function liveGithub(login: string) {
  return (url: string): Response | undefined => {
    const path = githubPath(url).split('?')[0];
    if (path === `/users/${login}`) return jsonResponse(apiUser(login));
    if (path === `/users/${login}/repos`) return jsonResponse([apiFork(login)]);
    if (path === `/repos/${login}/tool`) {
      return jsonResponse({ ...apiFork(login), parent: { full_name: 'upstream/tool', language: 'Go' } });
    }
    if (path === `/users/${login}/social_accounts`) return jsonResponse([{ provider: 'twitter', url: 'https://twitter.com/octo' }]);
    if (path === `/users/${login}/orgs`) return jsonResponse([]);
    if (path === `/users/${login}/starred`) {
      return jsonResponse([{}], { headers: { Link: '<https://api.github.com/user/1/starred?per_page=1&page=7>; rel="last"' } });
    }
    return undefined;
  };
}

const rateLimited = () =>
  jsonResponse(
    { message: 'API rate limit exceeded' },
    { status: 403, headers: { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1792662328', 'x-ratelimit-limit': '60' } },
  );

describe('loadProfile', () => {
  it('uses live data for every section when the API works', async () => {
    stubFetch(liveGithub('octo'));
    const state = await loadProfile('octo');

    if (state.status !== 'ready') throw new Error(`unexpected status ${state.status}`);
    expect(state.failure).toBeUndefined();
    expect(state.user.name).toBe('Octo Cat');
    expect(state.repos.map((repo) => repo.name)).toEqual(['tool']);
    expect(state.orgs).toEqual([]); // an empty live result is kept, not replaced with mock
    expect(state.starredCount).toBe(7);
    expect(state.extras).toBeNull(); // no sample data for this user
  });

  it('does not wait for fork parents (they are loaded separately)', async () => {
    stubFetch(liveGithub('octo'));
    const state = await loadProfile('octo');
    if (state.status !== 'ready') throw new Error(`unexpected status ${state.status}`);
    expect(state.repos[0].parentFullName).toBeUndefined();
  });

  it('reports notFound for an unknown user, without mock data', async () => {
    stubFetch(() => jsonResponse({ message: 'Not Found' }, { status: 404 }));
    await expect(loadProfile('nobody-here')).resolves.toEqual({ status: 'notFound' });
  });

  describe('for shreeramk (the user the sample data describes)', () => {
    it('shows the design’s organization when GitHub lists no public ones (the membership is private)', async () => {
      stubFetch(liveGithub('shreeramk')); // live orgs: []
      const state = await loadProfile('shreeramk');

      if (state.status !== 'ready') throw new Error(`unexpected status ${state.status}`);
      expect(state.orgs).toEqual(mockOrgs);
      expect(state.failure).toBeUndefined(); // not a failure, so no banner
    });

    it('falls back to sample data for every section when GitHub is unreachable', async () => {
      // setup.ts makes every fetch reject by default
      const state = await loadProfile('shreeramk');

      if (state.status !== 'ready') throw new Error(`unexpected status ${state.status}`);
      expect(state.failure).toEqual({ rateLimited: false });
      expect(state.user).toEqual(mockUser);
      expect(state.repos).toEqual(mockRepos);
      expect(state.extras).toEqual(mockExtras('shreeramk'));
    });

    it('replaces only the failing section and reports the rate limit', async () => {
      const live = liveGithub('shreeramk');
      stubFetch((url) => (githubPath(url).endsWith('/orgs') ? rateLimited() : live(url)));
      const state = await loadProfile('shreeramk');

      if (state.status !== 'ready') throw new Error(`unexpected status ${state.status}`);
      expect(state.user.name).toBe('Octo Cat'); // live
      expect(state.orgs).toEqual(mockOrgs); // sample
      expect(state.failure).toEqual({ rateLimited: true, resetAt: new Date(1792662328 * 1000), limit: 60 });
    });
  });

  describe('for any other user', () => {
    it('returns an error instead of showing shreeramk’s sample data', async () => {
      stubFetch(rateLimited);
      await expect(loadProfile('octo')).resolves.toEqual({
        status: 'error',
        failure: { rateLimited: true, resetAt: new Date(1792662328 * 1000), limit: 60 },
      });
    });

    it('returns an error even if only one section fails', async () => {
      const live = liveGithub('octo');
      stubFetch((url) => (githubPath(url).endsWith('/orgs') ? undefined : live(url)));
      await expect(loadProfile('octo')).resolves.toEqual({ status: 'error', failure: { rateLimited: false } });
    });
  });
});

describe('fork parents', () => {
  const fork = (name: string, extra: Partial<Repo> = {}): Repo => ({
    ...mockRepos[0],
    name,
    fullName: `octo/${name}`,
    parentFullName: undefined,
    language: null,
    ...extra,
  });

  it('only looks up popular forks that have no parent yet', () => {
    const repos = [fork('a'), fork('b', { fork: false }), fork('c', { parentFullName: 'up/c' })];
    expect(forksNeedingParents(repos).map((repo) => repo.name)).toEqual(['a']);
  });

  it('loads parents and skips failed lookups', async () => {
    const live = liveGithub('octo');
    stubFetch((url) => (githubPath(url) === '/repos/octo/broken' ? undefined : live(url)));
    const parents = await loadForkParents([fork('tool'), fork('broken')]);
    expect([...parents.keys()]).toEqual(['octo/tool']);
  });

  it('adds "Forked from" and falls back to the parent’s language', () => {
    const parents = new Map([['octo/tool', { fullName: 'upstream/tool', language: 'Go' }]]);
    const [tool, other] = withForkParents([fork('tool'), fork('other', { language: 'Rust' })], parents);
    expect(tool).toMatchObject({ parentFullName: 'upstream/tool', language: 'Go' });
    expect(other).toMatchObject({ parentFullName: undefined, language: 'Rust' });
  });
});
