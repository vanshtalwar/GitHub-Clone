import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EChart } from './EChart';

// setup.ts replaces EChart with a stub for every other test; this file tests the real wrapper
// against a fake ECharts instance.
vi.unmock('./EChart');

const chart = { setOption: vi.fn(), resize: vi.fn(), dispose: vi.fn() };
vi.mock('echarts/core', () => ({ use: vi.fn(), init: vi.fn(() => chart) }));

describe('EChart', () => {
  beforeEach(() => {
    chart.setOption.mockClear();
    chart.dispose.mockClear();
  });

  it('creates the chart, applies each new option, and disposes it on unmount', async () => {
    const { init } = await import('echarts/core');
    const first = { series: [] };
    const second = { series: [{ type: 'custom' }] };

    const { rerender, unmount, getByRole } = render(<EChart option={first} ariaLabel="Contribution graph" />);
    expect(init).toHaveBeenCalledWith(getByRole('img', { name: 'Contribution graph' }), undefined, { renderer: 'svg' });
    expect(chart.setOption).toHaveBeenLastCalledWith(first, { notMerge: true });

    rerender(<EChart option={second} ariaLabel="Contribution graph" />);
    expect(chart.setOption).toHaveBeenLastCalledWith(second, { notMerge: true });

    unmount();
    expect(chart.dispose).toHaveBeenCalledTimes(1);
  });
});
