import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { jsonResponse, stubFetch } from '../test/http';
import { useContributions } from './useContributions';

describe('useContributions', () => {
  it('starts loading, then returns live data', async () => {
    stubFetch(() =>
      jsonResponse({ total: 5, from: '2026-10-22', to: '2026-10-22', days: [{ date: '2026-10-22', count: 5, level: 3 }] }),
    );
    const { result } = renderHook(() => useContributions('shreeramk', 'last'));

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current).toMatchObject({ source: 'live', calendar: { total: 5 } });
  });

  it('falls back to mock data when the API is unreachable', async () => {
    // setup.ts makes every fetch reject by default
    const { result } = renderHook(() => useContributions('shreeramk', 2024));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current).toMatchObject({ source: 'mock', calendar: { from: '2024-01-01', to: '2024-12-31' } });
  });

  it('returns an error for other users instead of shreeramk-style mock data', async () => {
    // setup.ts makes every fetch reject by default
    const { result } = renderHook(() => useContributions('octo', 'last'));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current).toEqual({ status: 'error', failure: { rateLimited: false } });
  });

  it('reports notFound for an unknown user instead of inventing data', async () => {
    stubFetch(() => jsonResponse({ error: 'GitHub user "nobody" not found.' }, { status: 404 }));
    const { result } = renderHook(() => useContributions('nobody', 'last'));
    await waitFor(() => expect(result.current.status).toBe('notFound'));
  });
});
