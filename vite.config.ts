import react from '@vitejs/plugin-react';
import type { Connect, Plugin } from 'vite';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { handleActivity } from './server/githubActivity.ts';
import { handleContributions } from './server/githubContributions.ts';
import { serverOptions, type HttpResponse } from './server/githubGraphql.ts';
import { handleProfileDetails } from './server/githubProfile.ts';
import { getGithubRest } from './server/githubRest.ts';
import { ACTIVITY_PATH, CONTRIBUTIONS_PATH, GITHUB_REST_PATH, PROFILE_DETAILS_PATH } from './shared/github.ts';

/**
 * Serves the Netlify Functions locally (npm run dev / npm run preview), so the app behaves as on Netlify.
 * The token comes from GITHUB_TOKEN in the environment or .env / .env.local and stays in this Node process.
 */
function netlifyFunctions(env: Record<string, string>): Plugin {
  const options = serverOptions(env);
  const functions: Record<string, (params: URLSearchParams) => Promise<HttpResponse>> = {
    [CONTRIBUTIONS_PATH]: (params) => handleContributions(params, options),
    [ACTIVITY_PATH]: (params) => handleActivity(params, options),
    [PROFILE_DETAILS_PATH]: (params) => handleProfileDetails(params, options),
    [GITHUB_REST_PATH]: (params) => getGithubRest(params.get('path') ?? '', { token: options.token }),
  };

  const register = ({ middlewares }: { middlewares: Connect.Server }) => {
    for (const [path, run] of Object.entries(functions)) {
      middlewares.use(path, (req, res) => {
        const params = new URL(req.url ?? '/', 'http://localhost').searchParams;
        // The functions never reject; the catch is a last line of defence, because an unhandled rejection here
        // would terminate the dev server.
        void run(params)
          .catch(() => ({ status: 500, body: '{"error":"Unexpected error"}', headers: { 'Content-Type': 'application/json' } }))
          .then(({ status, body, headers }) => {
            res.writeHead(status, headers);
            res.end(body);
          });
      });
    }
  };
  return { name: 'netlify-functions', configureServer: register, configurePreviewServer: register };
}

// https://vite.dev/config/ and https://vitest.dev/config/
export default defineConfig(({ mode }) => {
  // '' prefix: read GITHUB_TOKEN too. Only used here on the server; Vite exposes just VITE_* variables to the client.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), netlifyFunctions(env)],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  };
});
