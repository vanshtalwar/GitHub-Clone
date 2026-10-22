import { loadContributions, type ContributionsResult, type ReadyContributions } from '../context/loadContributions';
import type { ContributionPeriod } from '../types/github';
import { useLoader } from './useLoader';

export type { ReadyContributions } from '../context/loadContributions';

export type ContributionsState =
  /** `previous` is the same user's last calendar, so a period switch can keep it on screen while loading. */
  | { status: 'loading'; previous?: ReadyContributions }
  | ContributionsResult;

/** Contribution calendar for a user and period (rules in loadContributions). */
export function useContributions(username: string, period: ContributionPeriod): ContributionsState {
  const user = username.toLowerCase();
  const { value, last } = useLoader(`${user}:${period}`, () => loadContributions(username, period));
  if (value) return value;
  const previous = last?.key.startsWith(`${user}:`) && last.value.status === 'ready' ? last.value : undefined;
  return { status: 'loading', previous };
}
