import { POPULAR_REPO_COUNT } from '../config';
import type { Repo } from '../types/github';

/**
 * GitHub's "Popular repositories" when nothing is pinned: most stars, then most forks, then oldest first.
 * The oldest-first tiebreak reproduces the live order for shreeramk, whose repos all have 0 stars and 0 forks.
 */
export function selectPopularRepos(repos: Repo[], limit = POPULAR_REPO_COUNT): Repo[] {
  return [...repos]
    .sort(
      (a, b) =>
        b.stargazersCount - a.stargazersCount ||
        b.forksCount - a.forksCount ||
        a.createdAt.localeCompare(b.createdAt),
    )
    .slice(0, limit);
}
