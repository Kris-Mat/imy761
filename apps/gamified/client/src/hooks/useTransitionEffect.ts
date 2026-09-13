import { useEffect, useRef, useState } from 'react';

// Detects a value settling into a new state that matches `shouldTrigger`
// while a component stays mounted — never on the value's first render, only
// on an actual change after that — and reports `true` for `durationMs` so
// the caller can play a one-shot transition animation instead of snapping
// straight to the new state. One shared mechanism (mirroring Phase 1's
// useAnswerFeedback) behind every "did this just resolve/increase/finish"
// animation added in Phase 2: a day card's active-to-done glow, a pip
// filling in, a streak number ticking up.
export function useTransitionEffect<T>(
  value: T,
  shouldTrigger: (previous: T, next: T) => boolean,
  durationMs: number
): boolean {
  const prevRef = useRef(value);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const previous = prevRef.current;
    prevRef.current = value;
    if (!shouldTrigger(previous, value)) return undefined;
    setActive(true);
    const timer = setTimeout(() => setActive(false), durationMs);
    return () => clearTimeout(timer);
    // shouldTrigger is a fresh inline predicate per call site — depending on
    // its identity would refire this effect on every render instead of only
    // on a real value change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return active;
}
