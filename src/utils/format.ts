const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** 2186 → "2,186" */
export function formatCount(value: number): string {
  return value.toLocaleString('en-US');
}

/** "public" → "Public" (the repo visibility label) */
export function formatVisibility(visibility: string): string {
  return visibility.charAt(0).toUpperCase() + visibility.slice(1);
}

/** "1 repository", "13 repositories" */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatCount(count)} ${count === 1 ? singular : plural}`;
}

/**
 * GitHub's "Updated …" wording: relative within a month ("Updated 3 days ago"),
 * otherwise a date ("Updated on Sep 13", plus the year if it isn't this year).
 */
export function formatUpdated(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const elapsed = now.getTime() - date.getTime();

  if (elapsed < MINUTE) return 'Updated now';
  if (elapsed < HOUR) return `Updated ${pluralize(Math.floor(elapsed / MINUTE), 'minute')} ago`;
  if (elapsed < DAY) return `Updated ${pluralize(Math.floor(elapsed / HOUR), 'hour')} ago`;
  if (elapsed < 2 * DAY) return 'Updated yesterday';
  if (elapsed < 30 * DAY) return `Updated ${Math.floor(elapsed / DAY)} days ago`;

  const sameYear = date.getFullYear() === now.getFullYear();
  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
  return `Updated on ${formatted}`;
}

/** 1 → "1st", 22 → "22nd", 13 → "13th" */
export function ordinal(n: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0]}`;
}

/** GitHub's heatmap tooltip: "No contributions on October 21st." / "5 contributions on October 21st." */
export function formatContributionDay(isoDate: string, count: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  const month = date.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
  const amount = count === 0 ? 'No contributions' : pluralize(count, 'contribution');
  return `${amount} on ${month} ${ordinal(date.getUTCDate())}.`;
}

/** 15:15 local time → "3:15 PM" */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
