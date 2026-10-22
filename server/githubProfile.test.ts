import { describe, expect, it, vi } from 'vitest';
import { getProfileDetails, handleProfileDetails, toStatus } from './githubProfile.ts';

function graphqlResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const project = {
  title: 'Roadmap',
  shortDescription: 'What we ship next',
  url: 'https://github.com/users/octo/projects/1',
  closed: false,
  updatedAt: '2026-10-01T10:00:00Z',
};

describe('getProfileDetails', () => {
  it('returns the status and the projects', async () => {
    const fetchMock = vi.fn(async () =>
      graphqlResponse({
        data: {
          user: {
            status: { message: 'Focusing', emojiHTML: '<div>🎯</div>' },
            projectsV2: { totalCount: 1, nodes: [project, null] },
          },
        },
      }),
    );
    const result = await getProfileDetails(new URLSearchParams('user=shreeramk'), { token: 'token', fetchImpl: fetchMock });

    expect(result).toEqual({
      status: 200,
      body: { status: { emoji: '🎯', message: 'Focusing' }, projects: { totalCount: 1, items: [project] } },
    });
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(JSON.parse(init.body as string).variables).toEqual({ login: 'shreeramk' });
  });

  it('answers 404 for an organization or unknown login (GraphQL `user` is null)', async () => {
    const fetchMock = vi.fn(async () => graphqlResponse({ data: { user: null }, errors: [{ type: 'NOT_FOUND', message: 'x' }] }));
    const response = await handleProfileDetails(new URLSearchParams('user=github'), { token: 'token', fetchImpl: fetchMock });
    expect(response).toMatchObject({ status: 404, headers: { 'Cache-Control': 'no-store' } });
  });

  it('caches successful answers per user', async () => {
    const fetchMock = vi.fn(async () => graphqlResponse({ data: { user: { status: null, projectsV2: { totalCount: 0, nodes: [] } } } }));
    const response = await handleProfileDetails(new URLSearchParams('user=octo'), { token: 'token', fetchImpl: fetchMock });
    expect(response.headers).toMatchObject({ 'Netlify-Vary': 'query=user' });
    expect(JSON.parse(response.body)).toEqual({ status: null, projects: { totalCount: 0, items: [] } });
  });
});

describe('toStatus', () => {
  it('reads the emoji character from emojiHTML', () => {
    expect(toStatus({ message: 'call me', emojiHTML: '<div>📞</div>' })).toEqual({ emoji: '📞', message: 'call me' });
  });

  it('keeps a status without a usable emoji (custom emoji are images) or without a message', () => {
    expect(toStatus({ message: 'Shipping', emojiHTML: '<div><img src="octocat.png"></div>' })).toEqual({ emoji: '', message: 'Shipping' });
    expect(toStatus({ message: null, emojiHTML: '<div>🌴</div>' })).toEqual({ emoji: '🌴', message: '' });
  });

  it('returns null when there is no status', () => {
    expect(toStatus(null)).toBeNull();
    expect(toStatus({ message: ' ', emojiHTML: null })).toBeNull();
  });
});
