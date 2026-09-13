import { useEffect, useState } from 'react';
import { useLocation, useOutlet } from 'react-router';
import { Box } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import { PAGE_FADE_MS, pageKind } from '../lib/pageTransition';

// Global page-transition fade (Fix 7): outgoing content fades out, then the
// new route's element swaps in and fades in — the same timing/easing
// Quests.tsx's own list<->farm-detail fade already uses (PAGE_FADE_MS).
//
// Deliberately not a plain `<Outlet />`: React Router swaps the matched
// element the instant location changes, so an in-place opacity toggle on
// that same Outlet could only ever fade the NEW page in, never fade the OLD
// one out first (there'd be nothing old left to fade). Freezing a snapshot
// of the previous page's element for the fade-out window, then handing
// back over to the live outlet, is what makes "outgoing fades out, incoming
// fades in" real rather than just a fade-in.
function PageFadeOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  const reducedMotion = useReducedMotion(false, { getInitialValueInEffect: false });
  const kind = pageKind(location.pathname);

  // Tracks the kind/element as of the last render, adjusted during render
  // (React's own endorsed pattern for "derive state from a changed prop" —
  // already used elsewhere in this app, e.g. QuestRunner's shownAtPhase —
  // rather than a ref: this project's lint config disallows reading/
  // writing refs during render). `outlet` is a fresh element reference on
  // every render of this component, including ones with no real
  // navigation, so this only ever calls setState when something actually
  // changed, never on an unrelated re-render.
  const [trackedKind, setTrackedKind] = useState(kind);
  const [trackedOutlet, setTrackedOutlet] = useState(outlet);
  const [frozenElement, setFrozenElement] = useState<React.ReactNode>(null);
  const [visible, setVisible] = useState(true);

  if (kind !== trackedKind) {
    // An actual page change — freeze what was showing a moment ago and
    // start the fade-out; the effect below hands back over to the live
    // outlet once the fade finishes. Moving between steps within one quest
    // run (same farmId/stepIndex route, different params) keeps the same
    // "quest-runner" kind and takes the branch below instead — no
    // buffering, no fade, left entirely to that flow's own reveal/feedback
    // animations.
    if (!reducedMotion) {
      setFrozenElement(trackedOutlet);
      setVisible(false);
    }
    setTrackedKind(kind);
    setTrackedOutlet(outlet);
  } else if (outlet !== trackedOutlet) {
    setTrackedOutlet(outlet);
  }

  useEffect(() => {
    if (frozenElement == null) return undefined;
    const timer = window.setTimeout(() => {
      setFrozenElement(null);
      setVisible(true);
    }, PAGE_FADE_MS);
    return () => clearTimeout(timer);
  }, [frozenElement]);

  return (
    <Box style={{
      opacity: visible ? 1 : 0, transition: `opacity ${PAGE_FADE_MS}ms ease` 
    }}
    >
      {frozenElement ?? outlet}
    </Box>
  );
}

export default PageFadeOutlet;
