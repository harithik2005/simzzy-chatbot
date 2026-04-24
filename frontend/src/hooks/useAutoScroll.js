import { useEffect, useRef } from 'react';

/**
 * Always scrolls the referenced container to the bottom
 * when messages or isLoading change.
 */
export function useAutoScroll(dependencies = []) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, dependencies);

  return containerRef;
}
