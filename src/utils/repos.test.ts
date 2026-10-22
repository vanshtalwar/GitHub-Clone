import { describe, expect, it } from 'vitest';
import type { Repo } from '../types/github';
import { selectPopularRepos } from './repos';

function repo(name: string, stargazersCount: number, forksCount: number, createdAt: string): Repo {
  return {
    name,
    fullName: `octo/${name}`,
    htmlUrl: `https://github.com/octo/${name}`,
    description: null,
    visibility: 'public',
    fork: false,
    language: null,
    stargazersCount,
    forksCount,
    createdAt,
    updatedAt: createdAt,
  };
}

describe('selectPopularRepos', () => {
  it('orders by stars, then forks, then oldest first', () => {
    const repos = [
      repo('newer-tie', 0, 0, '2023-01-01T00:00:00Z'),
      repo('older-tie', 0, 0, '2020-01-01T00:00:00Z'),
      repo('forked', 0, 3, '2024-01-01T00:00:00Z'),
      repo('starred', 5, 0, '2025-01-01T00:00:00Z'),
    ];
    expect(selectPopularRepos(repos).map((r) => r.name)).toEqual(['starred', 'forked', 'older-tie', 'newer-tie']);
  });

  it('returns at most `limit` repos without changing the input', () => {
    const repos = Array.from({ length: 8 }, (_, i) => repo(`r${i}`, i, 0, '2020-01-01T00:00:00Z'));
    const original = [...repos];
    expect(selectPopularRepos(repos)).toHaveLength(6);
    expect(repos).toEqual(original);
  });
});
