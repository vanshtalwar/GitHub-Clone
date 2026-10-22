// Contribution calendar from GitHub's GraphQL API (requirement 3a). GraphQL needs a token, so the browser calls
// our serverless function (netlify/functions/contributions.mts → server/githubContributions.ts), which holds it.
import { CONTRIBUTIONS_PATH } from '../../shared/github';
import type { ContributionCalendar, ContributionPeriod } from '../types/github';
import { cached } from './cache';
import { fetchJson } from './http';

export function getContributions(username: string, period: ContributionPeriod): Promise<ContributionCalendar> {
  // Logins are case-insensitive: one spelling per user keeps both this cache and Netlify's CDN cache from splitting.
  const login = username.toLowerCase();
  return cached(`contributions:${login}:${period}`, async () => {
    const query = new URLSearchParams({ user: login, y: String(period) });
    const { data } = await fetchJson<ContributionCalendar>(`${CONTRIBUTIONS_PATH}?${query}`);
    return data;
  });
}
