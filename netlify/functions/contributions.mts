// Netlify Function: GET /.netlify/functions/contributions?user=<login>&y=last|YYYY
// Proxies GitHub's GraphQL contributions API with the GITHUB_TOKEN environment variable (set in Netlify),
// so the token never reaches the browser. Optional CONTRIBUTIONS_ALLOWED_USERS limits which logins it serves.
import { contributionsHeaders, getContributionCalendar, parseAllowedUsers } from '../../server/githubContributions.ts';

export default async (request: Request): Promise<Response> => {
  const result = await getContributionCalendar(new URL(request.url).searchParams, {
    token: process.env.GITHUB_TOKEN,
    allowedUsers: parseAllowedUsers(process.env.CONTRIBUTIONS_ALLOWED_USERS),
  });
  return new Response(JSON.stringify(result.body), { status: result.status, headers: contributionsHeaders(result) });
};
