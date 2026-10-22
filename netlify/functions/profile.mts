// Netlify Function: GET /.netlify/functions/profile?user=<login>
// The status message and Projects from GitHub's GraphQL API, with the GITHUB_TOKEN environment variable.
import { serverOptions } from '../../server/githubGraphql.ts';
import { handleProfileDetails } from '../../server/githubProfile.ts';

export default async (request: Request): Promise<Response> => {
  const { status, body, headers } = await handleProfileDetails(new URL(request.url).searchParams, serverOptions(process.env));
  return new Response(body, { status, headers });
};
