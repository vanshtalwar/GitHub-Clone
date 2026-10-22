// ECharts is the largest dependency, so it lives in its own chunk, loaded on demand.

export const loadChart = () => import('./EChart').then((module) => ({ default: module.EChart }));

/** Starts downloading the chart code early (alongside the data) instead of after the data arrives. */
export function preloadChart(): void {
  void loadChart().catch(() => {
    // The lazy component tries again and reports a failure through its error boundary.
  });
}
