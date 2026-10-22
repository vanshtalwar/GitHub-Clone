import { useLayoutEffect, useRef, useState } from 'react';

/** Content width of an element, kept up to date with ResizeObserver. 0 until measured (and in jsdom). */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}
