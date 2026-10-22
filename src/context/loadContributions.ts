// Loads a contribution calendar, with the same live/sample rules as loadProfile.
import { getContributions } from '../api/contributions';
import { describeFailure, type LoadFailure } from '../api/failure';
import { NotFoundError } from '../api/http';
import { generateMockContributions } from '../mocks/contributions';
import { hasMockProfile } from '../mocks/profile';
import type { ContributionCalendar, ContributionPeriod, DataSource } from '../types/github';

export interface ReadyContributions {
  status: 'ready';
  calendar: ContributionCalendar;
  /** The period this calendar covers (the heading says "in the last year" or "in 2019"). */
  period: ContributionPeriod;
  source: DataSource;
  /** Why sample data is shown (source 'mock' only). */
  failure?: LoadFailure;
}

export type ContributionsResult = { status: 'notFound' } | { status: 'error'; failure: LoadFailure } | ReadyContributions;

/** A 404 means the user doesn't exist; other failures fall back to seeded sample data where it exists. Never rejects. */
export async function loadContributions(username: string, period: ContributionPeriod): Promise<ContributionsResult> {
  try {
    return { status: 'ready', calendar: await getContributions(username, period), period, source: 'live' };
  } catch (error) {
    if (error instanceof NotFoundError) return { status: 'notFound' };
    const failure = describeFailure([error]);
    if (!hasMockProfile(username)) return { status: 'error', failure };
    return { status: 'ready', calendar: generateMockContributions(period, username), period, source: 'mock', failure };
  }
}
