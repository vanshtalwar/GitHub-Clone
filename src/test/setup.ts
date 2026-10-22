import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, beforeEach, vi } from 'vitest';
import { clearCache } from '../api/cache';

// jsdom has no layout or SVG measuring, so ECharts can't render there. Every test gets a stub that keeps the
// chart's accessible label; components/charts/EChart.test.tsx tests the real wrapper.
vi.mock('../components/charts/EChart', () => ({
  EChart: ({ ariaLabel }: { ariaLabel?: string }) => createElement('div', { role: 'img', 'aria-label': ariaLabel }),
}));

beforeEach(() => {
  // Tests must never hit the real APIs (rate limits, flakiness). By default every request fails like a
  // network error, so components fall back to mock data; tests that need responses use stubFetch().
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new TypeError('Network access is disabled in tests'))),
  );
});

afterEach(() => {
  // Vitest globals are off, so Testing Library can't register its automatic cleanup.
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
  // Also drops requests still in flight from this test, so their late results can't leak into the next one.
  clearCache();
  localStorage.clear();
});
