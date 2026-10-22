import { FIRST_GITHUB_YEAR } from '../../shared/github';
import type { ContributionPeriod } from '../types/github';

export function currentYear(): number {
  return new Date().getFullYear();
}

/**
 * The ?year= query parameter → the period to show. Only past years are selectable; anything else
 * (missing, invalid, the current year) means GitHub's default "last year" view.
 */
export function parsePeriod(value: string | null, thisYear: number): ContributionPeriod {
  const year = Number(value);
  return value && Number.isInteger(year) && year >= FIRST_GITHUB_YEAR && year < thisYear ? year : 'last';
}

/** The heading's wording: "the last year" or "2019". */
export function describePeriod(period: ContributionPeriod): string {
  return period === 'last' ? 'the last year' : String(period);
}

/**
 * Month label for the activity timeline, counted back from the selected period's last month:
 * the current month for "last year", December for a past year. Keeps the mock timeline in step with the graph.
 */
export function activityMonth(period: ContributionPeriod, monthsAgo: number, now = new Date()): { month: string; year: number } {
  const anchor = period === 'last' ? { year: now.getFullYear(), month: now.getMonth() } : { year: period, month: 11 };
  const date = new Date(Date.UTC(anchor.year, anchor.month - monthsAgo, 1));
  return {
    month: date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }),
    year: date.getUTCFullYear(),
  };
}

/** Years for the year list: this year first, back to the year the account was created. */
export function profileYears(createdAt: string, thisYear: number): number[] {
  const firstYear = Math.min(thisYear, Math.max(FIRST_GITHUB_YEAR, new Date(createdAt).getUTCFullYear()));
  return Array.from({ length: thisYear - firstYear + 1 }, (_, i) => thisYear - i);
}
