import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useLoader } from './useLoader';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

describe('useLoader', () => {
  it('returns the result for the current key and remembers the last one', async () => {
    const { result, rerender } = renderHook(({ key }) => useLoader(key, async () => `value for ${key}`), {
      initialProps: { key: 'a' },
    });
    expect(result.current.value).toBeUndefined();
    await waitFor(() => expect(result.current.value).toBe('value for a'));

    rerender({ key: 'b' });
    expect(result.current.value).toBeUndefined(); // b is loading
    expect(result.current.last).toEqual({ key: 'a', value: 'value for a' }); // a is still available
    await waitFor(() => expect(result.current.value).toBe('value for b'));
  });

  it('ignores a result that arrives after the key changed', async () => {
    const slow = deferred<string>();
    const { result, rerender } = renderHook(({ key }) => useLoader(key, () => (key === 'slow' ? slow.promise : Promise.resolve('fast'))), {
      initialProps: { key: 'slow' },
    });
    rerender({ key: 'fast' });
    await waitFor(() => expect(result.current.value).toBe('fast'));

    slow.resolve('stale');
    await Promise.resolve();
    expect(result.current.value).toBe('fast');
    expect(result.current.last).toEqual({ key: 'fast', value: 'fast' });
  });
});
