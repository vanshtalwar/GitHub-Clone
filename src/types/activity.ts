// Types for the "Activity overview" panel and the "Contribution activity" timeline. Shared with the activity function
// (server/githubActivity.ts), which builds them from GitHub's GraphQL API; src/mocks/activity.ts is the sample data.
export type {
  ActivityData,
  ActivityItem,
  ActivityMonth,
  ActivityOrg,
  ActivityOverview,
  CommitActivity,
  PrivateActivity,
  PullRequestActivity,
} from '../../shared/github';
