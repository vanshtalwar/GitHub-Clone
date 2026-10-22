import { describe, expect, it } from 'vitest';
import { formatContributionDay, formatCount, formatUpdated, ordinal, pluralize } from './format';

describe('ordinal / formatContributionDay', () => {
  it('adds English ordinal suffixes', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 31].map(ordinal)).toEqual([
      '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '31st',
    ]);
  });

  it('matches GitHub tooltip wording', () => {
    expect(formatContributionDay('2025-10-21', 0)).toBe('No contributions on October 21st.');
    expect(formatContributionDay('2025-10-22', 1)).toBe('1 contribution on October 22nd.');
    expect(formatContributionDay('2026-01-03', 1200)).toBe('1,200 contributions on January 3rd.');
  });
});

describe('formatCount / pluralize', () => {
  it('adds thousands separators', () => {
    expect(formatCount(2186)).toBe('2,186');
  });

  it('picks singular or plural', () => {
    expect(pluralize(1, 'repository', 'repositories')).toBe('1 repository');
    expect(pluralize(13, 'repository', 'repositories')).toBe('13 repositories');
    expect(pluralize(2, 'commit')).toBe('2 commits');
  });
});

describe('formatUpdated', () => {
  const now = new Date(2026, 9, 22, 12, 0); // 22 Oct 2026, noon local

  it('is relative within a month', () => {
    expect(formatUpdated(new Date(2026, 9, 22, 11, 59, 30).toISOString(), now)).toBe('Updated now');
    expect(formatUpdated(new Date(2026, 9, 22, 11, 15).toISOString(), now)).toBe('Updated 45 minutes ago');
    expect(formatUpdated(new Date(2026, 9, 22, 7, 0).toISOString(), now)).toBe('Updated 5 hours ago');
    expect(formatUpdated(new Date(2026, 9, 21, 9, 0).toISOString(), now)).toBe('Updated yesterday');
    expect(formatUpdated(new Date(2026, 9, 12, 12, 0).toISOString(), now)).toBe('Updated 10 days ago');
  });

  it('shows a date after a month, with the year only when it differs', () => {
    expect(formatUpdated(new Date(2026, 6, 4, 12, 0).toISOString(), now)).toBe('Updated on Jul 4');
    expect(formatUpdated(new Date(2023, 8, 13, 12, 0).toISOString(), now)).toBe('Updated on Sep 13, 2023');
  });
});
