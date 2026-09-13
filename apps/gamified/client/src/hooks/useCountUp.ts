import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@mantine/hooks';

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

// Animates a displayed number up to `target` from wherever it last landed —
// 0 on a fresh mount (so a score bar counts up from 0 every time its page
// loads), or the previous target if it changes again while the component
// stays mounted (a live update counts up from the number already on
// screen, not back down to 0). prefers-reduced-motion jumps straight to the
// final value with no animated count at all.
export function useCountUp(target: number, durationMs = 700): number {
  const reducedMotion = useReducedMotion(false, { getInitialValueInEffect: false });
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    if (reducedMotion || from === target) {
      fromRef.current = target;
      setDisplay(target);
      return undefined;
    }
    const start = performance.now();
    let frame: number;
    function tick(now: number) {
      const t = Math.min(1, (now - start) / durationMs);
      setDisplay(Math.round(from + (target - from) * easeOutCubic(t)));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // durationMs/reducedMotion intentionally excluded — only a real change in
    // target should restart the count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return display;
}
