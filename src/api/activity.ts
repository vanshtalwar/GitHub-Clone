// Activity overview + monthly timeline from GitHub's GraphQL API, through our serverless function
// (netlify/functions/activity.mts → server/githubActivity.ts), which holds the token.
import { ACTIVITY_PATH } from '../../shared/github';
import type { ActivityData } from '../types/activity';
import type { ContributionPeriod } from '../types/github';
import { cached } from './cache';
import { fetchJson } from './http';

export function getActivity(username: string, period: ContributionPeriod): Promise<ActivityData> {
  const login = username.toLowerCase();
  return cached(`activity:${login}:${period}`, async () => {
    const query = new URLSearchParams({ user: login, y: String(period) });
    const { data } = await fetchJson<ActivityData>(`${ACTIVITY_PATH}?${query}`);
    return data;
  });
}
