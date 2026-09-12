import { useLayoutEffect, useRef, useState } from 'react';

// Tracks an element's own content-box size via ResizeObserver — used by
// QuestScene to convert the camera target's percentage-based focus point
// into actual pixel translate amounts for each depth layer.
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({
    width: 0, height: 0
  });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({
        width: entry.contentRect.width, height: entry.contentRect.height
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}
