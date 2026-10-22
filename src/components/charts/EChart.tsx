import { HeatmapChart } from 'echarts/charts';
import { CalendarComponent, TooltipComponent, VisualMapPiecewiseComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { SVGRenderer } from 'echarts/renderers';
import { useEffect, useRef, type CSSProperties } from 'react';

// Tree-shaken ECharts: only what the contribution heatmap needs. Add more here when another chart needs them.
echarts.use([HeatmapChart, CalendarComponent, TooltipComponent, VisualMapPiecewiseComponent, SVGRenderer]);

/**
 * Generic React wrapper around one ECharts instance: creates it on mount (SVG renderer, crisp at any zoom),
 * applies `option` whenever it changes, follows the element's size, and disposes it on unmount.
 */
export function EChart({
  option,
  className,
  style,
  ariaLabel,
}: {
  option: echarts.EChartsCoreOption;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const element = elementRef.current!;
    const chart = echarts.init(element, undefined, { renderer: 'svg' });
    chartRef.current = chart;
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => chart.resize());
    observer?.observe(element);
    return () => {
      observer?.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true });
  }, [option]);

  return <div ref={elementRef} className={className} style={style} role="img" aria-label={ariaLabel} />;
}
