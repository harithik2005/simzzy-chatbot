import { useEffect, useRef } from 'react';

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
