// The design's "Activity overview" and "Contribution activity" for shreeramk. Live activity comes from GitHub's
// GraphQL API (server/githubActivity.ts), but all of shreeramk's contributions are in private repositories, which
// GitHub only itemises for the owner, and the design is the owner's view; so for shreeramk this is shown instead.
// Month 0 copies the screenshot; older months exist so "Show more activity" has something to reveal.
import type { ActivityData, ActivityMonth, ActivityOverview } from '../types/activity';

export const mockActivityOverview: ActivityOverview = {
  orgs: [
    { login: 'UptimeAI', avatarUrl: 'https://avatars.githubusercontent.com/u/68869855?v=4' },
    { login: 'timescale', avatarUrl: 'https://avatars.githubusercontent.com/u/8986001?v=4' },
  ],
  contributedTo: ['UptimeAI/uptime_webapp', 'UptimeAI/uptime_server', 'UptimeAI/uptime_ml'],
  otherRepoCount: 13,
  breakdown: { commits: 83, pullRequests: 17, issues: 0, codeReview: 0 },
};

export const mockActivityMonths: ActivityMonth[] = [
  {
    // Screenshot: "Created 56 commits in 11 repositories", "Opened 29 pull requests in 5 repositories"
    monthsAgo: 0,
    items: [
      {
        kind: 'commits',
        repos: [
          { name: 'UptimeAI/uptime_webapp', count: 17 },
          { name: 'UptimeAI/uptime_ml', count: 10 },
          { name: 'UptimeAI/uptime_server', count: 8 },
          { name: 'UptimeAI/uptime_scripts', count: 6 },
          { name: 'UptimeAI/uptime_engine', count: 5 },
          { name: 'UptimeAI/uptime_ml_encrypted', count: 3 },
          { name: 'UptimeAI/uptime_deploy', count: 2 },
          { name: 'UptimeAI/uptime_docs', count: 2 },
          { name: 'UptimeAI/uptime_alerts', count: 1 },
          { name: 'UptimeAI/uptime_reports', count: 1 },
          { name: 'UptimeAI/uptime_sdk', count: 1 },
        ],
      },
      {
        kind: 'pullRequests',
        repos: [
          { name: 'UptimeAI/uptime_webapp', merged: 16, open: 1, closed: 0 },
          { name: 'UptimeAI/uptime_ml', merged: 6, open: 0, closed: 0 },
          { name: 'UptimeAI/uptime_scripts', merged: 4, open: 0, closed: 0 },
          { name: 'UptimeAI/uptime_engine', merged: 1, open: 0, closed: 0 },
          { name: 'UptimeAI/uptime_ml_encrypted', merged: 1, open: 0, closed: 0 },
        ],
      },
    ],
  },
  {
    monthsAgo: 1,
    items: [
      {
        kind: 'commits',
        repos: [
          { name: 'UptimeAI/uptime_webapp', count: 14 },
          { name: 'UptimeAI/uptime_server', count: 9 },
          { name: 'UptimeAI/uptime_ml', count: 7 },
          { name: 'UptimeAI/uptime_engine', count: 5 },
          { name: 'UptimeAI/uptime_scripts', count: 3 },
          { name: 'UptimeAI/uptime_deploy', count: 2 },
          { name: 'UptimeAI/uptime_docs', count: 1 },
        ],
      },
      {
        kind: 'pullRequests',
        repos: [
          { name: 'UptimeAI/uptime_webapp', merged: 9, open: 0, closed: 0 },
          { name: 'UptimeAI/uptime_server', merged: 5, open: 0, closed: 0 },
          { name: 'UptimeAI/uptime_ml', merged: 3, open: 0, closed: 0 },
          { name: 'UptimeAI/uptime_engine', merged: 1, open: 0, closed: 0 },
        ],
      },
    ],
  },
  {
    monthsAgo: 2,
    items: [
      {
        kind: 'commits',
        repos: [
          { name: 'UptimeAI/uptime_ml', count: 12 },
          { name: 'UptimeAI/uptime_webapp', count: 9 },
          { name: 'UptimeAI/uptime_server', count: 6 },
          { name: 'UptimeAI/uptime_scripts', count: 4 },
          { name: 'UptimeAI/uptime_engine', count: 1 },
          { name: 'UptimeAI/uptime_alerts', count: 1 },
        ],
      },
      {
        kind: 'pullRequests',
        repos: [
          { name: 'UptimeAI/uptime_ml', merged: 6, open: 0, closed: 0 },
          { name: 'UptimeAI/uptime_webapp', merged: 4, open: 0, closed: 0 },
          { name: 'UptimeAI/uptime_server', merged: 2, open: 0, closed: 0 },
        ],
      },
    ],
  },
];

export const mockActivity: ActivityData = { overview: mockActivityOverview, months: mockActivityMonths };
