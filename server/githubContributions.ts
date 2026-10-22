// Server-side only: fetches a user's contribution calendar from GitHub's GraphQL API (requirement 3a).
// GraphQL needs a token, which must never reach the browser, so this runs in the Netlify Function
// (netlify/functions/contributions.mts) and in the Vite dev/preview middleware (vite.config.ts).
import type { ContributionCalendar, ContributionLevel } from '../shared/github.ts';
import { GithubFailure } from './githubFetch.ts';
import {
  periodVariables,
  queryUser,
  readUserRequest,
  respond,
  toHttpResponse,
  type GraphqlOptions,
  type GraphqlResult,
  type HttpResponse,
} from './githubGraphql.ts';

export const CONTRIBUTIONS_QUERY = `query ($login: String!, $from: DateTime, $to: DateTime) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
  }
}`;

// GitHub's ContributionLevel enum → the 0–4 level the heatmap colours by
const LEVELS: Record<string, ContributionLevel> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

interface CalendarUser {
  contributionsCollection?: {
    contributionCalendar?: {
      totalContributions: number;
      weeks: { contributionDays: { date: string; contributionCount: number; contributionLevel: string }[] }[];
    };
  };
}

export type ContributionsResult = GraphqlResult<ContributionCalendar>;

/**
 * Handles `?user=<login>&y=last|YYYY`. "last" is GitHub's default window (the profile's "in the last year");
 * a year is Jan 1 – Dec 31. Never throws: every outcome, including unexpected errors, is a status + JSON body.
 */
export function getContributionCalendar(params: URLSearchParams, options: GraphqlOptions): Promise<ContributionsResult> {
  return respond(async () => {
    const request = readUserRequest(params, options);
    const user = await queryUser<CalendarUser>(request, CONTRIBUTIONS_QUERY, periodVariables(request.year));
    const calendar = user.contributionsCollection?.contributionCalendar;
    if (!calendar) throw new GithubFailure(502, 'Unexpected response from GitHub');

    const days = calendar.weeks
      .flatMap((week) => week.contributionDays)
      .map((day) => ({ date: day.date, count: day.contributionCount, level: LEVELS[day.contributionLevel] ?? 0 }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return { total: calendar.totalContributions, days, from: days[0]?.date ?? '', to: days.at(-1)?.date ?? '' };
  }, 'Unexpected error while loading contributions');
}

/** The HTTP response for the contributions function (cached per user and period). */
export async function handleContributions(params: URLSearchParams, options: GraphqlOptions): Promise<HttpResponse> {
  return toHttpResponse(await getContributionCalendar(params, options), ['user', 'y']);
}
