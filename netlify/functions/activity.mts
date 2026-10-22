// Netlify Function: GET /.netlify/functions/activity?user=<login>&y=last|YYYY
// The activity overview and monthly timeline from GitHub's GraphQL API, with the GITHUB_TOKEN environment variable.
import { handleActivity } from '../../server/githubActivity.ts';
import { serverOptions } from '../../server/githubGraphql.ts';

export default async (request: Request): Promise<Response> => {
  const { status, body, headers } = await handleActivity(new URL(request.url).searchParams, serverOptions(process.env));
  return new Response(body, { status, headers });
};
