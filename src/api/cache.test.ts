import { describe, expect, it, vi } from 'vitest';
import { CACHE_TTL_MS } from '../config';
import { cached, clearCache, pruneCache, readCache, writeCache } from './cache';

describe('cache', () => {
  it('returns a value until its TTL expires', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-22T10:00:00Z'));
    writeCache('user:octo', { name: 'Octo' });

    vi.advanceTimersByTime(CACHE_TTL_MS - 1);
    expect(readCache('user:octo')).toEqual({ name: 'Octo' });

    vi.advanceTimersByTime(1);
    expect(readCache('user:octo')).toBeUndefined();
  });

  it('honours a custom TTL', () => {
    vi.useFakeTimers();
    writeCache('short', 1, 1000);
    vi.advanceTimersByTime(1000);
    expect(readCache('short')).toBeUndefined();
  });

  it('treats unavailable storage as a miss instead of throwing', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Blocked', 'SecurityError');
    });

    expect(readCache('anything')).toBeUndefined();
    expect(() => writeCache('anything', 1)).not.toThrow();
    await expect(cached('anything', async () => 42)).resolves.toBe(42);
  });

  it('serves repeat calls from the cache', async () => {
    const load = vi.fn(async () => 'value');
    await cached('key', load);
    await expect(cached('key', load)).resolves.toBe('value');
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('shares one request between concurrent callers', async () => {
    let resolve!: (value: string) => void;
    const load = vi.fn(() => new Promise<string>((r) => (resolve = r)));

    const first = cached('slow', load);
    const second = cached('slow', load);
    resolve('done');

    await expect(Promise.all([first, second])).resolves.toEqual(['done', 'done']);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('does not cache failures', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('rate limited')).mockResolvedValueOnce('ok');
    await expect(cached('flaky', load)).rejects.toThrow('rate limited');
    await expect(cached('flaky', load)).resolves.toBe('ok');
  });
});

describe('clearCache', () => {
  it('drops stored entries, and results of requests that were still running', async () => {
    writeCache('stored', 1);
    let resolve!: (value: string) => void;
    const late = cached('late', () => new Promise<string>((r) => (resolve = r)));

    clearCache();
    resolve('arrives after the clear');
    await expect(late).resolves.toBe('arrives after the clear'); // the caller still gets its answer…
    expect(readCache('late')).toBeUndefined(); // …but it isn't cached
    expect(readCache('stored')).toBeUndefined();
  });
});

describe('pruneCache', () => {
  it('removes expired entries, old cache versions and corrupt entries, and keeps everything else', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-22T10:00:00Z'));
    writeCache('fresh', 1);
    writeCache('stale', 2, 1000);
    localStorage.setItem('gh-profile:v1:user:octo', '{"expiresAt":0,"value":1}');
    localStorage.setItem('gh-profile:v3:corrupt', 'not json');
    localStorage.setItem('gh-profile:show-activity-overview', 'false'); // a preference, not cache
    localStorage.setItem('another-app', 'x');

    vi.advanceTimersByTime(1000);
    pruneCache();

    expect(Object.keys(localStorage).sort()).toEqual(['another-app', 'gh-profile:show-activity-overview', 'gh-profile:v3:fresh']);
  });
});
