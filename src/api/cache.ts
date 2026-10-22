// localStorage cache for API responses. Unauthenticated GitHub calls are limited to 60 per hour per IP,
// so repeat visits should be served from here. Caching is best-effort: if storage is unavailable
// (private mode, blocked cookies), every read is a miss and every write is skipped.
import { CACHE_TTL_MS, STORAGE_PREFIX } from '../config';

// Bump the version whenever a cached value's shape or source changes
// (v2: fork parents became objects; v3: contributions come from GitHub's GraphQL API).
const CACHE_PREFIX = `${STORAGE_PREFIX}v3:`;
/** Any cache version's entries (other STORAGE_PREFIX keys are preferences, not cache). */
const ANY_CACHE_VERSION = new RegExp(`^${STORAGE_PREFIX}v\\d+:`);

interface Entry<T> {
  expiresAt: number;
  value: T;
}

export function readCache<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (raw === null) return undefined;
    const entry = JSON.parse(raw) as Entry<T>;
    if (Date.now() >= entry.expiresAt) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return undefined;
    }
    return entry.value;
  } catch {
    return undefined;
  }
}

export function writeCache<T>(key: string, value: T, ttlMs = CACHE_TTL_MS): void {
  try {
    const entry: Entry<T> = { expiresAt: Date.now() + ttlMs, value };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable.
  }
}

/**
 * Removes expired entries and entries from older cache versions. Entries are otherwise only removed when read,
 * so visiting many profiles would keep growing storage. Run once at startup.
 */
export function pruneCache(): void {
  try {
    const now = Date.now();
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (!key || !ANY_CACHE_VERSION.test(key)) continue; // not a cache entry
      if (!key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
        continue;
      }
      try {
        if (now >= (JSON.parse(localStorage.getItem(key) ?? '{}') as Entry<unknown>).expiresAt) localStorage.removeItem(key);
      } catch {
        localStorage.removeItem(key); // corrupt entry
      }
    }
  } catch {
    // Storage unavailable.
  }
}

const inFlight = new Map<string, Promise<unknown>>();
/** Bumped by clearCache(), so requests started before a clear don't write their results afterwards. */
let generation = 0;

/** Forgets everything: stored entries, in-flight requests, and late results of requests already running. */
export function clearCache(): void {
  inFlight.clear();
  generation++;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && ANY_CACHE_VERSION.test(key)) localStorage.removeItem(key);
    }
  } catch {
    // Storage unavailable.
  }
}

/**
 * Returns the cached value for `key`, or runs `load` and caches its result.
 * Concurrent callers share one request (React StrictMode runs effects twice in dev). The request can't hang
 * forever (fetchJson times out), so a shared request always settles. Failures are not cached, so the next call
 * retries. Requests aren't cancelled when a page is left: they're shared and their results are cached.
 */
export function cached<T>(key: string, load: () => Promise<T>, ttlMs = CACHE_TTL_MS): Promise<T> {
  const hit = readCache<T>(key);
  if (hit !== undefined) return Promise.resolve(hit);

  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const startedIn = generation;
  const request = load()
    .then((value) => {
      if (startedIn === generation) writeCache(key, value, ttlMs);
      return value;
    })
    .finally(() => {
      if (inFlight.get(key) === request) inFlight.delete(key);
    });
  inFlight.set(key, request);
  return request;
}
