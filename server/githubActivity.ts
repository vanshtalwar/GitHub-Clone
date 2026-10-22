// Server-side only: a user's activity for a period from GitHub's GraphQL API: the "Activity overview" panel and the
// monthly "Contribution activity" timeline, as on github.com. Public contributions are itemised; for private ones
// GitHub only reveals how many there were. Runs in netlify/functions/activity.mts and the Vite middleware.
import type {
  ActivityData,
  ActivityItem,
  ActivityMonth,
  ActivityOrg,
  ActivityOverview,
} from '../shared/github.ts';
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

/** How many months the timeline covers ("Show more activity" reveals them one by one). */
const TIMELINE_MONTHS = 12;
/**
 * Months per GraphQL query. The queries run in parallel: for very active users one query for all twelve months
 * plus the overview took over 8 s, close to the function's time limit; split, the slowest part takes about half.
 */
const MONTHS_PER_QUERY = 4;
/** "Contributed to A, B, C and N other repositories" */
const NAMED_REPOS = 3;
const MAX_ORG_CHIPS = 4;
/** Repos listed per month and item (GitHub shows the busiest ones). */
const REPOS_PER_MONTH = 10;
const PULL_REQUESTS_PER_REPO = 50;

const OVERVIEW_QUERY = `query ($login: String!, $from: DateTime, $to: DateTime) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      commitContributionsByRepository(maxRepositories: 100) { repository { ...Repo } contributions { totalCount } }
      issueContributionsByRepository(maxRepositories: 100) { repository { ...Repo } contributions { totalCount } }
      pullRequestContributionsByRepository(maxRepositories: 100) { repository { ...Repo } contributions { totalCount } }
      pullRequestReviewContributionsByRepository(maxRepositories: 100) { repository { ...Repo } contributions { totalCount } }
    }
  }
}
fragment Repo on Repository { nameWithOwner owner { __typename login avatarUrl } }`;

const MONTH_FRAGMENT = `fragment Month on ContributionsCollection {
  restrictedContributionsCount
  commitContributionsByRepository(maxRepositories: ${REPOS_PER_MONTH}) { repository { nameWithOwner } contributions { totalCount } }
  pullRequestContributionsByRepository(maxRepositories: ${REPOS_PER_MONTH}) {
    repository { nameWithOwner }
    contributions(first: ${PULL_REQUESTS_PER_REPO}) { nodes { pullRequest { state } } }
  }
}`;

interface RepoTotal {
  repository: { nameWithOwner: string; owner: { __typename: string; login: string; avatarUrl: string } };
  contributions: { totalCount: number };
}

interface OverviewUser {
  contributionsCollection: {
    totalCommitContributions: number;
    totalIssueContributions: number;
    totalPullRequestContributions: number;
    totalPullRequestReviewContributions: number;
    commitContributionsByRepository: RepoTotal[];
    issueContributionsByRepository: RepoTotal[];
    pullRequestContributionsByRepository: RepoTotal[];
    pullRequestReviewContributionsByRepository: RepoTotal[];
  };
}

interface MonthCollection {
  restrictedContributionsCount: number;
  commitContributionsByRepository: { repository: { nameWithOwner: string }; contributions: { totalCount: number } }[];
  pullRequestContributionsByRepository: {
    repository: { nameWithOwner: string };
    contributions: { nodes: ({ pullRequest: { state: string } | null } | null)[] };
  }[];
}

export interface MonthRange {
  monthsAgo: number;
  /** YYYY-MM */
  month: string;
  from: string;
  to: string;
}

/** The timeline's months, newest first: back from this month ("last year") or from December of a past year. */
export function timelineMonths(year: number | null, now = new Date()): MonthRange[] {
  const anchorYear = year ?? now.getUTCFullYear();
  const anchorMonth = year === null ? now.getUTCMonth() : 11;
  return Array.from({ length: TIMELINE_MONTHS }, (_, monthsAgo) => {
    const start = new Date(Date.UTC(anchorYear, anchorMonth - monthsAgo, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1) - 1000);
    return { monthsAgo, month: start.toISOString().slice(0, 7), from: start.toISOString(), to: end.toISOString() };
  });
}

/** One query for several months, each as an aliased contributionsCollection (m0, m1, …). Dates are generated here. */
function monthsQuery(ranges: MonthRange[]): string {
  const fields = ranges.map(
    ({ monthsAgo, from, to }) => `m${monthsAgo}: contributionsCollection(from: "${from}", to: "${to}") { ...Month }`,
  );
  return `query ($login: String!) { user(login: $login) { ${fields.join(' ')} } }\n${MONTH_FRAGMENT}`;
}

/** Handles `?user=<login>&y=last|YYYY`. Never throws. */
export function getActivity(params: URLSearchParams, options: GraphqlOptions): Promise<GraphqlResult<ActivityData>> {
  return respond(async () => {
    const request = readUserRequest(params, options);
    const ranges = timelineMonths(request.year);
    const batches = Array.from({ length: Math.ceil(ranges.length / MONTHS_PER_QUERY) }, (_, i) =>
      ranges.slice(i * MONTHS_PER_QUERY, (i + 1) * MONTHS_PER_QUERY),
    );

    const [overviewUser, ...monthUsers] = await Promise.all([
      queryUser<OverviewUser>(request, OVERVIEW_QUERY, periodVariables(request.year)),
      ...batches.map((batch) => queryUser<Record<string, MonthCollection>>(request, monthsQuery(batch))),
    ]);
    const collections: Record<string, MonthCollection> = Object.assign({}, ...monthUsers);

    return {
      overview: toOverview(overviewUser.contributionsCollection),
      months: ranges
        .map((range) => toMonth(range, collections[`m${range.monthsAgo}`]))
        .filter((month) => month.items.length > 0),
    };
  }, 'Unexpected error while loading activity');
}

/** The HTTP response for the activity function (cached per user and period). */
export async function handleActivity(params: URLSearchParams, options: GraphqlOptions): Promise<HttpResponse> {
  return toHttpResponse(await getActivity(params, options), ['user', 'y']);
}

/** Percentages by type, the busiest repositories, and the organizations that own them. */
export function toOverview(collection: OverviewUser['contributionsCollection']): ActivityOverview {
  const totals = {
    commits: collection.totalCommitContributions,
    pullRequests: collection.totalPullRequestContributions,
    issues: collection.totalIssueContributions,
    codeReview: collection.totalPullRequestReviewContributions,
  };
  const sum = totals.commits + totals.pullRequests + totals.issues + totals.codeReview;
  const percent = (count: number) => (sum === 0 ? 0 : Math.round((count / sum) * 100));

  // Every kind of contribution counts towards a repository's rank
  const repos = new Map<string, { count: number; owner: RepoTotal['repository']['owner'] }>();
  for (const list of [
    collection.commitContributionsByRepository,
    collection.issueContributionsByRepository,
    collection.pullRequestContributionsByRepository,
    collection.pullRequestReviewContributionsByRepository,
  ]) {
    for (const { repository, contributions } of list) {
      const entry = repos.get(repository.nameWithOwner) ?? { count: 0, owner: repository.owner };
      entry.count += contributions.totalCount;
      repos.set(repository.nameWithOwner, entry);
    }
  }
  const ranked = [...repos].sort(([nameA, a], [nameB, b]) => b.count - a.count || nameA.localeCompare(nameB));

  const orgs = new Map<string, ActivityOrg>();
  for (const [, { owner }] of ranked) {
    if (owner.__typename === 'Organization' && !orgs.has(owner.login)) {
      orgs.set(owner.login, { login: owner.login, avatarUrl: owner.avatarUrl });
    }
  }

  return {
    orgs: [...orgs.values()].slice(0, MAX_ORG_CHIPS),
    contributedTo: ranked.slice(0, NAMED_REPOS).map(([name]) => name),
    otherRepoCount: Math.max(0, ranked.length - NAMED_REPOS),
    breakdown: {
      commits: percent(totals.commits),
      pullRequests: percent(totals.pullRequests),
      issues: percent(totals.issues),
      codeReview: percent(totals.codeReview),
    },
  };
}

/** One month's timeline items: commits per repo, pull requests per repo by state, and the private count. */
export function toMonth({ monthsAgo, month }: MonthRange, collection: MonthCollection | undefined): ActivityMonth {
  const items: ActivityItem[] = [];
  if (!collection) return { monthsAgo, month, items };

  const commits = collection.commitContributionsByRepository
    .map(({ repository, contributions }) => ({ name: repository.nameWithOwner, count: contributions.totalCount }))
    .filter((repo) => repo.count > 0);
  if (commits.length > 0) items.push({ kind: 'commits', repos: commits });

  const pullRequests = collection.pullRequestContributionsByRepository
    .map(({ repository, contributions }) => {
      const states = contributions.nodes.map((node) => node?.pullRequest?.state);
      const count = (state: string) => states.filter((value) => value === state).length;
      return { name: repository.nameWithOwner, merged: count('MERGED'), open: count('OPEN'), closed: count('CLOSED') };
    })
    .filter((repo) => repo.merged + repo.open + repo.closed > 0);
  if (pullRequests.length > 0) items.push({ kind: 'pullRequests', repos: pullRequests });

  if (collection.restrictedContributionsCount > 0) {
    items.push({ kind: 'private', count: collection.restrictedContributionsCount });
  }
  return { monthsAgo, month, items };
}
