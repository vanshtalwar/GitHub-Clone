// Netlify Function: GET /.netlify/functions/github?path=<GitHub REST path>
// Forwards the page's read-only GitHub REST calls with the GITHUB_TOKEN environment variable (set in Netlify), so
// visitors share the token's rate limit instead of each getting 60 requests per hour. The token never reaches the browser.
import { getGithubRest } from '../../server/githubRest.ts';

export default async (request: Request): Promise<Response> => {
  const path = new URL(request.url).searchParams.get('path') ?? '';
  const { status, body, headers } = await getGithubRest(path, { token: process.env.GITHUB_TOKEN });
  return new Response(body, { status, headers });
};
