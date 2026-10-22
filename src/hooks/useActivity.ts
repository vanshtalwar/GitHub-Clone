import { loadActivity, type ActivityResult } from '../context/loadActivity';
import type { ContributionPeriod } from '../types/github';
import { useLoader } from './useLoader';

export type ActivityState = { status: 'loading' } | ActivityResult;

/** Activity overview + timeline for a user and period (rules in loadActivity). */
export function useActivity(username: string, period: ContributionPeriod): ActivityState {
  return useLoader(`${username.toLowerCase()}:${period}`, () => loadActivity(username, period)).value ?? { status: 'loading' };
}
