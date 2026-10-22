// Pure helpers that turn a ContributionCalendar into an ECharts option, so the chart logic is testable without a DOM.
import type { EChartsOption } from 'echarts';
import type { ContributionCalendar } from '../../types/github';
import { addDays, daysBetween, parseIsoDate, startOfWeek } from '../../utils/date';
import { formatContributionDay } from '../../utils/format';

/** Room for the Mon/Wed/Fri labels on the left and the month labels on top. */
export const DAY_LABEL_WIDTH = 32;
export const MONTH_LABEL_HEIGHT = 20;
const RIGHT_PADDING = 4;
const MIN_PITCH = 11;
const MAX_PITCH = 15;

export interface CalendarColors {
  /** Green scale, index = contribution level 0–4 */
  levels: [string, string, string, string, string];
  /** Box background; drawn as each cell's border, which makes the gaps between cells */
  background: string;
  text: string;
  tooltipBackground: string;
  tooltipText: string;
  fontFamily: string;
}

// Same values as tokens.css; used when CSS variables can't be read (tests).
const FALLBACK_COLORS: CalendarColors = {
  levels: ['#eff2f5', '#aceebb', '#4ac26b', '#2da44e', '#116329'],
  background: '#ffffff',
  text: '#1f2328',
  tooltipBackground: '#25292e',
  tooltipText: '#ffffff',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
};

/** Reads the calendar colours from the design tokens, so the chart and the legend can't drift apart. */
export function readCalendarColors(): CalendarColors {
  const styles = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
  return {
    levels: FALLBACK_COLORS.levels.map((fallback, level) => read(`--color-calendar-l${level}`, fallback)) as CalendarColors['levels'],
    background: read('--color-canvas', FALLBACK_COLORS.background),
    text: read('--color-fg', FALLBACK_COLORS.text),
    tooltipBackground: read('--color-tooltip-bg', FALLBACK_COLORS.tooltipBackground),
    tooltipText: read('--color-fg-on-emphasis', FALLBACK_COLORS.tooltipText),
    fontFamily: read('--font-sans', FALLBACK_COLORS.fontFamily),
  };
}

export interface CalendarLayout {
  /** Cell size plus gap, in px */
  pitch: number;
  gap: number;
  weeks: number;
  width: number;
  height: number;
}

/** Number of week columns (Sunday-first) needed to show `from`…`to`. */
export function weekCount(from: string, to: string): number {
  return Math.floor(daysBetween(startOfWeek(parseIsoDate(from)), parseIsoDate(to)) / 7) + 1;
}

/** Cells grow to fill the available width (11–15px pitch); past the minimum, the graph scrolls instead. */
export function fitPitch(from: string, to: string, availableWidth: number): number {
  const fit = Math.floor((availableWidth - DAY_LABEL_WIDTH - RIGHT_PADDING) / weekCount(from, to));
  return Math.min(MAX_PITCH, Math.max(MIN_PITCH, fit));
}

/** Chart geometry for a pitch. Depends only on the pitch, so resizing within the same pitch changes nothing. */
export function calendarLayout(from: string, to: string, pitch: number): CalendarLayout {
  const weeks = weekCount(from, to);
  return {
    pitch,
    gap: pitch >= 13 ? 3 : 2,
    weeks,
    width: DAY_LABEL_WIDTH + weeks * pitch + RIGHT_PADDING,
    height: MONTH_LABEL_HEIGHT + 7 * pitch,
  };
}

/**
 * Like GitHub, only label the first month if it spans at least two week columns; otherwise its label
 * would collide with the next month's (live GitHub shows "Oct Nov" for a range starting Oct 19, but hides Oct for Oct 26).
 */
export function shouldLabelFirstMonth(from: string): boolean {
  const start = parseIsoDate(from);
  const nextMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  return weekCount(from, addDaysIso(nextMonth, -1)) >= 2;
}

function addDaysIso(date: Date, days: number): string {
  return addDays(date, days).toISOString().slice(0, 10);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * ECharts calendar heatmap: a `heatmap` series on the calendar coordinate system, one cell per day, coloured
 * green by GitHub's contribution level (0–4) through a piecewise visualMap.
 */
export function buildCalendarOption(
  calendar: ContributionCalendar,
  layout: CalendarLayout,
  colors: CalendarColors = FALLBACK_COLORS,
): EChartsOption {
  const firstMonth = calendar.from.slice(0, 7);
  const labelFirstMonth = shouldLabelFirstMonth(calendar.from);
  const labelStyle = { color: colors.text, fontSize: 12, fontFamily: colors.fontFamily };

  return {
    animation: false,
    tooltip: {
      trigger: 'item',
      appendTo: 'body', // escape the graph's scroll box
      backgroundColor: colors.tooltipBackground,
      borderWidth: 0,
      padding: [6, 8],
      textStyle: { color: colors.tooltipText, fontSize: 12, fontFamily: colors.fontFamily },
      extraCssText: 'border-radius: 6px; box-shadow: none;',
      transitionDuration: 0,
      // Centred above the hovered cell, like GitHub's tooltip
      position: (point, _params, _dom, rect, size) =>
        rect
          ? [rect.x + rect.width / 2 - size.contentSize[0] / 2, rect.y - size.contentSize[1] - 6]
          : [point[0] - size.contentSize[0] / 2, point[1] - size.contentSize[1] - 12],
      formatter: (params) => {
        const [date, count] = (params as unknown as { value: [string, number, number] }).value;
        return formatContributionDay(date, count);
      },
    },
    calendar: {
      top: MONTH_LABEL_HEIGHT,
      left: DAY_LABEL_WIDTH,
      cellSize: [layout.pitch, layout.pitch],
      range: [calendar.from, calendar.to],
      orient: 'horizontal',
      splitLine: { show: false },
      itemStyle: { color: 'transparent', borderWidth: 0 },
      yearLabel: { show: false },
      dayLabel: {
        firstDay: 0, // weeks start on Sunday
        nameMap: ['', 'Mon', '', 'Wed', '', 'Fri', ''],
        position: 'start',
        margin: 6,
        ...labelStyle,
      },
      monthLabel: {
        position: 'start',
        align: 'left',
        margin: 6,
        ...labelStyle,
        formatter: (param) => {
          const { yyyy, MM, M } = param as unknown as { yyyy: string; MM: string; M: string };
          if (!labelFirstMonth && `${yyyy}-${MM}` === firstMonth) return '';
          return MONTHS[Number(M) - 1];
        },
      },
    },
    // Maps each day's level (data dimension 2) to GitHub's five greens. Hidden: the page draws its own
    // "Less ■■■■■ More" legend from the same tokens.
    visualMap: {
      type: 'piecewise',
      show: false,
      dimension: 2,
      pieces: colors.levels.map((color, level) => ({ value: level, color })),
    },
    series: [
      {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: calendar.days.map((day) => [day.date, day.count, day.level]),
        // A border in the background colour opens the gaps between cells; the radius rounds the corners
        itemStyle: { borderColor: colors.background, borderWidth: layout.gap, borderRadius: 2 + layout.gap / 2 },
        emphasis: { disabled: true },
      },
    ],
  };
}
