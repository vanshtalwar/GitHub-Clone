import { describe, expect, it } from 'vitest';
import { generateMockContributions } from './contributions';

const NOW = new Date(2026, 9, 22, 12); // 22 Oct 2026, local time

describe('generateMockContributions', () => {
  it('is deterministic for the same seed and period', () => {
    expect(generateMockContributions('last', 'shreeramk', NOW)).toEqual(
      generateMockContributions('last', 'shreeramk', NOW),
    );
    expect(generateMockContributions('last', 'someone-else', NOW)).not.toEqual(
      generateMockContributions('last', 'shreeramk', NOW),
    );
  });

  it('covers the last year like the real API: Sunday a year ago until today', () => {
    const calendar = generateMockContributions('last', 'shreeramk', NOW);
    expect(calendar.from).toBe('2025-10-19'); // the Sunday on or before 22 Oct 2025
    expect(calendar.to).toBe('2026-10-22');
    expect(calendar.days).toHaveLength(369);
  });

  it('covers a full calendar year with no contributions in the future', () => {
    const calendar = generateMockContributions(2026, 'shreeramk', NOW);
    expect(calendar.from).toBe('2026-01-01');
    expect(calendar.to).toBe('2026-12-31');
    expect(calendar.days.filter((day) => day.date > '2026-10-22').every((day) => day.count === 0)).toBe(true);
  });

  it('keeps totals and levels consistent', () => {
    const { total, days } = generateMockContributions(2024, 'shreeramk', NOW);
    expect(days).toHaveLength(366); // leap year
    expect(total).toBe(days.reduce((sum, day) => sum + day.count, 0));
    expect(total).toBeGreaterThan(0);
    for (const day of days) {
      expect(day.level).toBeGreaterThanOrEqual(0);
      expect(day.level).toBeLessThanOrEqual(4);
      expect(day.level === 0).toBe(day.count === 0);
    }
  });
});
