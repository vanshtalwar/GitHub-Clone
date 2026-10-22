// Loads the activity overview and monthly timeline, with the same live/sample rules as loadProfile.
import { getActivity } from '../api/activity';
import { describeFailure, type LoadFailure } from '../api/failure';
import { NotFoundError } from '../api/http';
import { mockActivity } from '../mocks/activity';
import { hasMockProfile } from '../mocks/profile';
import type { ActivityData } from '../types/activity';
import type { ContributionPeriod, DataSource } from '../types/github';

export type ActivityResult =
  | { status: 'ready'; activity: ActivityData; source: DataSource; failure?: LoadFailure }
  | { status: 'error'; failure: LoadFailure };

const NO_ACTIVITY: ActivityData = {
  overview: { orgs: [], contributedTo: [], otherRepoCount: 0, breakdown: { commits: 0, pullRequests: 0, issues: 0, codeReview: 0 } },
  months: [],
};

/**
 * Live activity for everyone. For shreeramk, GitHub itemises nothing (every contribution is in a private repository,
 * which only the owner sees in detail) while the design shows the owner's view, so that user gets the design's
 * activity whenever the live data has nothing public. Never rejects.
 */
export async function loadActivity(username: string, period: ContributionPeriod): Promise<ActivityResult> {
  try {
    const live = await getActivity(username, period);
    if (hasMockProfile(username) && !hasPublicActivity(live)) return { status: 'ready', activity: mockActivity, source: 'mock' };
    return { status: 'ready', activity: live, source: 'live' };
  } catch (error) {
    // GraphQL has no `user` for an organization's login: nothing to show, not a failure
    if (error instanceof NotFoundError) return { status: 'ready', activity: NO_ACTIVITY, source: 'live' };
    const failure = describeFailure([error]);
    if (hasMockProfile(username)) return { status: 'ready', activity: mockActivity, source: 'mock', failure };
    return { status: 'error', failure };
  }
}

/** Whether there's anything beyond a count of private contributions. */
export function hasPublicActivity({ overview, months }: ActivityData): boolean {
  const { commits, pullRequests, issues, codeReview } = overview.breakdown;
  return commits + pullRequests + issues + codeReview > 0 || months.some((month) => month.items.some((item) => item.kind !== 'private'));
}
