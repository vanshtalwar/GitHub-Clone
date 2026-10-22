// Calendar-date helpers. Dates are handled as UTC midnight so "YYYY-MM-DD" strings never shift with the time zone.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Today's local calendar date, as UTC midnight. */
export function todayUtc(now = new Date()): Date {
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

/** "2025-10-19" → that date at UTC midnight */
export function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Whole days from `a` to `b` (both UTC midnight). */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** The Sunday on or before `date` (GitHub's calendar weeks start on Sunday). */
export function startOfWeek(date: Date): Date {
  return addDays(date, -date.getUTCDay());
}
