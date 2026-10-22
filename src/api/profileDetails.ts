// The status message and Projects from GitHub's GraphQL API, through our serverless function
// (netlify/functions/profile.mts → server/githubProfile.ts), which holds the token.
import { PROFILE_DETAILS_PATH } from '../../shared/github';
import type { ProfileDetails } from '../types/github';
import { cached } from './cache';
import { fetchJson } from './http';

export function getProfileDetails(username: string): Promise<ProfileDetails> {
  const login = username.toLowerCase();
  return cached(`details:${login}`, async () => {
    const { data } = await fetchJson<ProfileDetails>(`${PROFILE_DETAILS_PATH}?${new URLSearchParams({ user: login })}`);
    return data;
  });
}
