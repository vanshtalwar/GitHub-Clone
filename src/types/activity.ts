// Types for the "Activity overview" panel and the "Contribution activity" timeline.
// No public API provides this data, so it always comes from src/mocks/activity.ts.

export interface ActivityOrg {
  login: string;
  avatarUrl: string;
}

export interface ActivityOverview {
  /** Org filter chips above the overview. */
  orgs: ActivityOrg[];
  /** Repos named in "Contributed to A, B, C" */
  contributedTo: string[];
  /** The "and N other repositories" count. */
  otherRepoCount: number;
  /** Share of contributions by type, in percent. */
  breakdown: {
    commits: number;
    pullRequests: number;
    issues: number;
    codeReview: number;
  };
}

export interface CommitActivity {
  kind: 'commits';
  repos: { name: string; count: number }[];
}

export interface PullRequestActivity {
  kind: 'pullRequests';
  repos: { name: string; merged: number; open: number }[];
}

export type ActivityItem = CommitActivity | PullRequestActivity;

/** One month of the timeline. Months are relative to the last month of the selected period, so mock data never looks out of date. */
export interface ActivityMonth {
  monthsAgo: number;
  items: ActivityItem[];
}
