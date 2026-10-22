import type { ActivityOverview } from '../../types/activity';
import styles from './ActivityCrossChart.module.css';

// Drawing space; the SVG scales to its container width through the viewBox.
const WIDTH = 320;
const HEIGHT = 240;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
const AXIS = 82; // half-length of each axis

/**
 * GitHub's activity overview "cross": one axis per contribution type, and a shape whose corners sit at each
 * type's share. Like GitHub, the largest share reaches the end of its axis (values are scaled to the maximum).
 */
export function ActivityCrossChart({ breakdown }: { breakdown: ActivityOverview['breakdown'] }) {
  const { commits, pullRequests, issues, codeReview } = breakdown;
  const scale = AXIS / Math.max(commits, pullRequests, issues, codeReview, 1);

  const top: [number, number] = [CX, CY - codeReview * scale];
  const right: [number, number] = [CX + issues * scale, CY];
  const bottom: [number, number] = [CX, CY + pullRequests * scale];
  const left: [number, number] = [CX - commits * scale, CY];
  const markers = [
    { value: codeReview, point: top },
    { value: issues, point: right },
    { value: pullRequests, point: bottom },
    { value: commits, point: left },
  ].filter((marker) => marker.value > 0);

  const percent = (value: number) => (value > 0 ? `${value}%` : null);
  const summary = `Activity overview: ${commits}% commits, ${pullRequests}% pull requests, ${issues}% issues, ${codeReview}% code review`;

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.chart} role="img" aria-label={summary}>
      <line x1={CX} y1={CY - AXIS} x2={CX} y2={CY + AXIS} className={styles.axis} />
      <line x1={CX - AXIS} y1={CY} x2={CX + AXIS} y2={CY} className={styles.axis} />
      <polygon points={[top, right, bottom, left].map((p) => p.join(',')).join(' ')} className={styles.shape} />
      {markers.map(({ point }) => (
        <circle key={point.join()} cx={point[0]} cy={point[1]} r={4} className={styles.marker} />
      ))}

      <g className={styles.labels} aria-hidden="true">
        <Label x={CX} y={CY - AXIS - 10} anchor="middle" value={percent(codeReview)} name="Code review" above />
        <Label x={CX + AXIS + 10} y={CY + 4} anchor="start" value={percent(issues)} name="Issues" />
        <Label x={CX - AXIS - 10} y={CY + 4} anchor="end" value={percent(commits)} name="Commits" />
        <Label x={CX} y={CY + AXIS + 18} anchor="middle" value={percent(pullRequests)} name="Pull requests" />
      </g>
    </svg>
  );
}

/** A type name with its percentage on the line above (when non-zero), as on GitHub. */
function Label({
  x,
  y,
  anchor,
  value,
  name,
  above = false,
}: {
  x: number;
  y: number;
  anchor: 'start' | 'middle' | 'end';
  value: string | null;
  name: string;
  above?: boolean;
}) {
  // Two-line labels grow away from the chart: upwards above it, downwards below it, centred on the side axes.
  const nameY = value ? (above ? y : anchor === 'middle' ? y + 14 : y + 7) : y;
  const valueY = above ? y - 14 : anchor === 'middle' ? y : y - 7;
  return (
    <text textAnchor={anchor}>
      {value && (
        <tspan x={x} y={valueY}>
          {value}
        </tspan>
      )}
      <tspan x={x} y={nameY}>
        {name}
      </tspan>
    </text>
  );
}
