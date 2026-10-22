import { describeFailure, type LoadFailure } from '../api/failure';
import { getStarred } from '../api/github';
import type { Repo } from '../types/github';
import { useLoader } from './useLoader';

export type StarredState =
  | { status: 'loading' }
  | { status: 'error'; failure: LoadFailure }
  | { status: 'ready'; repos: Repo[] };

/** Never rejects. No sample-data fallback: the screenshot doesn't show starred repos. */
async function loadStarred(username: string): Promise<StarredState> {
  try {
    return { status: 'ready', repos: await getStarred(username) };
  } catch (error) {
    return { status: 'error', failure: describeFailure([error]) };
  }
}

/** Starred repos, fetched only when the Stars tab mounts. */
export function useStarred(username: string): StarredState {
  return useLoader(username.toLowerCase(), () => loadStarred(username)).value ?? { status: 'loading' };
}
