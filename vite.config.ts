import react from '@vitejs/plugin-react';
import type { Connect, Plugin } from 'vite';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { contributionsHeaders, getContributionCalendar, parseAllowedUsers } from './server/githubContributions.ts';
import { CONTRIBUTIONS_PATH } from './shared/github.ts';

/**
 * Serves the contributions function locally (npm run dev / npm run preview), so the app behaves as on Netlify.
 * The token comes from GITHUB_TOKEN in the environment or .env.local and stays in this Node process.
 */
function contributionsFunction(env: Record<string, string>): Plugin {
  const handle: Connect.NextHandleFunction = (req, res) => {
    const params = new URL(req.url ?? '/', 'http://localhost').searchParams;
    // getContributionCalendar never rejects; the catch is a last line of defence, because an unhandled
    // rejection here would terminate the dev server.
    void getContributionCalendar(params, {
      token: env.GITHUB_TOKEN,
      allowedUsers: parseAllowedUsers(env.CONTRIBUTIONS_ALLOWED_USERS),
    })
      .catch(() => ({ status: 500, body: { error: 'Unexpected error' } }))
      .then((result) => {
        res.writeHead(result.status, contributionsHeaders(result));
        res.end(JSON.stringify(result.body));
      });
  };
  return {
    name: 'contributions-function',
    configureServer: (server) => void server.middlewares.use(CONTRIBUTIONS_PATH, handle),
    configurePreviewServer: (server) => void server.middlewares.use(CONTRIBUTIONS_PATH, handle),
  };
}

// https://vite.dev/config/ and https://vitest.dev/config/
export default defineConfig(({ mode }) => {
  // '' prefix: read GITHUB_TOKEN too. Only used here on the server; Vite exposes just VITE_* variables to the client.
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), contributionsFunction(env)],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  };
});
