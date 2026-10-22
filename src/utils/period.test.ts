import { describe, expect, it } from 'vitest';
import { activityMonth, describePeriod, parsePeriod, profileYears } from './period';

describe('activityMonth', () => {
  const now = new Date(2026, 9, 22); // 22 Oct 2026

  it('counts back from the current month for the last-year view', () => {
    expect(activityMonth('last', 0, now)).toEqual({ month: 'October', year: 2026 });
    expect(activityMonth('last', 10, now)).toEqual({ month: 'December', year: 2025 });
  });

  it('counts back from December for a past year', () => {
    expect(activityMonth(2019, 0, now)).toEqual({ month: 'December', year: 2019 });
    expect(activityMonth(2019, 2, now)).toEqual({ month: 'October', year: 2019 });
  });
});

describe('describePeriod', () => {
  it('words the heading from the period itself', () => {
    expect(describePeriod(2019)).toBe('2019');
    expect(describePeriod('last')).toBe('the last year');
  });
});

describe('parsePeriod', () => {
  it('accepts past years only', () => {
    expect(parsePeriod('2019', 2026)).toBe(2019);
    expect(parsePeriod('2025', 2026)).toBe(2025);
  });

  it('falls back to the last-year view', () => {
    expect(parsePeriod(null, 2026)).toBe('last');
    expect(parsePeriod('2026', 2026)).toBe('last'); // the current year is the default view
    expect(parsePeriod('2030', 2026)).toBe('last');
    expect(parsePeriod('1999', 2026)).toBe('last');
    expect(parsePeriod('20x9', 2026)).toBe('last');
    expect(parsePeriod('', 2026)).toBe('last');
  });
});

describe('profileYears', () => {
  it('lists this year down to the year the account was created', () => {
    expect(profileYears('2013-09-18T18:46:47Z', 2026)).toEqual([
      2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013,
    ]);
    expect(profileYears('2026-05-01T00:00:00Z', 2026)).toEqual([2026]);
  });
});
