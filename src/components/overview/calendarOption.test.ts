import { describe, expect, it } from 'vitest';
import type { ContributionCalendar } from '../../types/github';
import { buildCalendarOption, calendarLayout, fitPitch, shouldLabelFirstMonth, weekCount } from './calendarOption';

const calendar: ContributionCalendar = {
  total: 6,
  from: '2025-10-19',
  to: '2026-10-22',
  days: [
    { date: '2025-10-19', count: 0, level: 0 },
    { date: '2025-10-20', count: 6, level: 4 },
  ],
};

describe('calendar layout', () => {
  it('counts Sunday-first week columns', () => {
    expect(weekCount('2025-10-19', '2026-10-22')).toBe(53); // GitHub's "last year": 369 days
    expect(weekCount('2019-01-01', '2019-12-31')).toBe(53);
    expect(weekCount('2025-10-19', '2025-10-25')).toBe(1);
  });

  it('fits the cells to the width, between 11 and 15px', () => {
    expect(fitPitch('2025-10-19', '2026-10-22', 720)).toBe(12);
    expect(fitPitch('2025-10-19', '2026-10-22', 724)).toBe(12); // a few pixels more: same pitch, so no redraw
    expect(fitPitch('2025-10-19', '2026-10-22', 2000)).toBe(15);
    expect(fitPitch('2025-10-19', '2026-10-22', 300)).toBe(11); // too narrow: keeps the minimum and scrolls
  });

  it('lays out the chart for a pitch', () => {
    expect(calendarLayout('2025-10-19', '2026-10-22', 12)).toEqual({ pitch: 12, gap: 2, weeks: 53, width: 32 + 53 * 12 + 4, height: 20 + 7 * 12 });
    expect(calendarLayout('2025-10-19', '2026-10-22', 15)).toMatchObject({ pitch: 15, gap: 3 });
  });

  it('labels the first month only if it spans two week columns', () => {
    expect(shouldLabelFirstMonth('2025-10-19')).toBe(true); // Oct 19 + Oct 26 columns
    expect(shouldLabelFirstMonth('2024-10-27')).toBe(false); // one column before November
    expect(shouldLabelFirstMonth('2019-01-01')).toBe(true);
  });
});

describe('buildCalendarOption', () => {
  const option = buildCalendarOption(calendar, calendarLayout(calendar.from, calendar.to, 12));
  const cal = option.calendar as {
    range: string[];
    cellSize: number[];
    dayLabel: { nameMap: string[]; firstDay: number };
    monthLabel: { formatter: (p: object) => string };
  };

  it('covers the API range with Sunday-first rows and Mon/Wed/Fri labels', () => {
    expect(cal.range).toEqual(['2025-10-19', '2026-10-22']);
    expect(cal.cellSize).toEqual([12, 12]);
    expect(cal.dayLabel.firstDay).toBe(0);
    expect(cal.dayLabel.nameMap).toEqual(['', 'Mon', '', 'Wed', '', 'Fri', '']);
    expect(cal.monthLabel.formatter({ yyyy: '2025', MM: '10', M: '10' })).toBe('Oct');
    expect(cal.monthLabel.formatter({ yyyy: '2026', MM: '01', M: '1' })).toBe('Jan');
  });

  it('hides the first month label when it would collide', () => {
    const late = { ...calendar, from: '2024-10-27', to: '2025-10-30' };
    const lateCal = buildCalendarOption(late, calendarLayout(late.from, late.to, 12)).calendar as typeof cal;
    expect(lateCal.monthLabel.formatter({ yyyy: '2024', MM: '10', M: '10' })).toBe('');
    expect(lateCal.monthLabel.formatter({ yyyy: '2024', MM: '11', M: '11' })).toBe('Nov');
  });

  it('is an ECharts calendar heatmap coloured green by contribution level', () => {
    const series = (option.series as { type: string; coordinateSystem: string; itemStyle: object }[])[0];
    expect(series.type).toBe('heatmap');
    expect(series.coordinateSystem).toBe('calendar');
    expect(series.itemStyle).toMatchObject({ borderColor: '#ffffff', borderWidth: 2 }); // the gaps between cells
    expect(option.visualMap).toEqual({
      type: 'piecewise',
      show: false,
      dimension: 2,
      pieces: [
        { value: 0, color: '#eff2f5' },
        { value: 1, color: '#aceebb' },
        { value: 2, color: '#4ac26b' },
        { value: 3, color: '#2da44e' },
        { value: 4, color: '#116329' },
      ],
    });
  });

  it('plots one point per day with its count and level, and GitHub tooltip text', () => {
    const series = (option.series as { data: unknown[] }[])[0];
    expect(series.data).toEqual([
      ['2025-10-19', 0, 0],
      ['2025-10-20', 6, 4],
    ]);
    const tooltip = option.tooltip as { formatter: (p: object) => string };
    expect(tooltip.formatter({ value: ['2025-10-20', 6, 4] })).toBe('6 contributions on October 20th.');
  });
});
