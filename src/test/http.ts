import { vi } from 'vitest';

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
