import { vi } from 'vitest';
import { GITHUB_API_URL, GITHUB_REST_PATH } from '../../shared/github';

/**
 * The GitHub REST path a request asks for, e.g. "/users/octo/repos?per_page=100", whether it went through the site's
 * GitHub function or straight to api.github.com. Other requests give "".
 */
export function githubPath(url: string): string {
  const parsed = new URL(url, 'http://site.test');
  if (parsed.origin === GITHUB_API_URL) return parsed.pathname + parsed.search;
  if (parsed.pathname === GITHUB_REST_PATH) return parsed.searchParams.get('path') ?? '';
  return '';
}

export function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  });
}

/** Replaces fetch with `handler`, keyed on the request URL. Unhandled URLs fail like a network error. */
export function stubFetch(handler: (url: string) => Response | undefined) {
  const fetchMock = vi.fn(async (input: string | URL) => {
    const url = String(input);
    const response = handler(url);
    if (!response) throw new TypeError(`Unhandled request in test: ${url}`);
    return response;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
