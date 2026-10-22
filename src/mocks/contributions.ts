// Fake contribution calendar, used when the contributions API can't be reached.
// Seeded, so the same user and period always produce the same graph (no flicker between renders, stable tests).
import type { ContributionCalendar, ContributionDay, ContributionLevel, ContributionPeriod } from '../types/github';
import { addDays, startOfWeek, toIsoDate, todayUtc } from '../utils/date';

export function generateMockContributions(
  period: ContributionPeriod,
  seed: string,
  now = new Date(),
): ContributionCalendar {
  const today = todayUtc(now);
  const { from, to } = periodRange(period, today);
  const random = mulberry32(hashString(`${seed}:${period}`));

  const days: ContributionDay[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    const weekend = date.getUTCDay() === 0 || date.getUTCDay() === 6;
    const active = date <= today && random() < (weekend ? 0.2 : 0.75);
    const count = active ? Math.ceil(random() ** 2 * 24) : 0;
    days.push({ date: toIsoDate(date), count, level: 0 });
  }

  const max = Math.max(1, ...days.map((day) => day.count));
  for (const day of days) {
    day.level = (day.count === 0 ? 0 : Math.max(1, Math.ceil((day.count / max) * 4))) as ContributionLevel;
  }

  return {
    total: days.reduce((sum, day) => sum + day.count, 0),
    days,
    from: toIsoDate(from),
    to: toIsoDate(to),
  };
}

/** Same ranges as the real API: the last year starts on a Sunday and ends today; a year runs Jan 1 – Dec 31. */
function periodRange(period: ContributionPeriod, today: Date): { from: Date; to: Date } {
  if (period === 'last') {
    const yearAgo = new Date(Date.UTC(today.getUTCFullYear() - 1, today.getUTCMonth(), today.getUTCDate()));
    return { from: startOfWeek(yearAgo), to: today };
  }
  return { from: new Date(Date.UTC(period, 0, 1)), to: new Date(Date.UTC(period, 11, 31)) };
}

function hashString(text: string): number {
  // FNV-1a
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
