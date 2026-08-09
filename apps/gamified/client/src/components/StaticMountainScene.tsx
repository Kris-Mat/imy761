import { createPortal } from 'react-dom';
import {
  FAR_MOUNTAINS_PATH, FRONT_CHARCOAL_PATH, HILL_CURVE, MID_MOUNTAINS_PATH
} from '../lib/hillShapes';
import { HILL_VERTICAL_OFFSET } from '../lib/heroParallax';

// Same sky/mountains/hill/charcoal scene as MountainBackground on Home, but
// with no scroll-parallax and no road/pins — a plain static backdrop.
//
// Rendered via a portal straight into document.body: Layout's ScrollSmoother
// applies a CSS transform to #smooth-content to fake smooth scrolling, and a
// transformed ancestor turns `position: fixed` descendants into
// `position: absolute` relative to it (per spec) — so from inside that
// subtree this would scroll with the page instead of staying put. Escaping
// to body sidesteps that entirely.
function StaticMountainScene() {
  return createPortal(
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: -1
      }}
    >
      <rect
        width={1600}
        height={900}
        fill="var(--mantine-color-sky-0)"
      />
      <path
        d={FAR_MOUNTAINS_PATH}
        fill="var(--mantine-color-moss-1)"
      />
      <path
        d={MID_MOUNTAINS_PATH}
        fill="var(--mantine-color-moss-2)"
      />
      <g transform={`translate(0, ${HILL_VERTICAL_OFFSET})`}>
        <path
          d={`${HILL_CURVE} L1600,900 L0,900 Z`}
          fill="var(--mantine-color-moss-4)"
        />
      </g>
      <path
        d={FRONT_CHARCOAL_PATH}
        fill="var(--mantine-color-charcoal-5)"
      />
    </svg>,
    document.body
  );
}

export default StaticMountainScene;
