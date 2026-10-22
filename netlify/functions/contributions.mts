// Netlify Function: GET /.netlify/functions/contributions?user=<login>&y=last|YYYY
// Proxies GitHub's GraphQL contributions API with the GITHUB_TOKEN environment variable (set in Netlify),
// so the token never reaches the browser. Optional CONTRIBUTIONS_ALLOWED_USERS limits which logins it serves.
import { handleContributions } from '../../server/githubContributions.ts';
import { serverOptions } from '../../server/githubGraphql.ts';

export default async (request: Request): Promise<Response> => {
  const { status, body, headers } = await handleContributions(new URL(request.url).searchParams, serverOptions(process.env));
  return new Response(body, { status, headers });
};
