import { createPortal } from 'react-dom';

// Same sky/mountains/hill/charcoal scene as the gamified app's static mountain
// backdrop (see apps/gamified/client/src/components/StaticMountainScene.tsx
// and lib/hillShapes.ts) — reproduced here with the exact same path data, but
// with no road/pins, since the plain app has no quest map.
const FAR_MOUNTAINS_PATH = 'M0,260 L180,120 L330,220 L520,90 L720,230 L900,140 L1080,235 L1260,150 '
  + 'L1440,225 L1600,170 L1600,900 L0,900 Z';

const MID_MOUNTAINS_PATH = 'M0,340 L160,210 L300,300 L480,170 L660,320 L840,210 L1020,310 L1200,220 '
  + 'L1380,300 L1600,250 L1600,900 L0,900 Z';

const HILL_CURVE = 'M0,300 C177,293 372,258 530,280 C688,302 822,383 950,430 '
  + 'C1078,477 1192,542 1300,560 C1408,578 1500,547 1600,540';

const FRONT_CHARCOAL_PATH = 'M0,780 C300,700 520,760 760,720 C980,680 1180,740 1400,700 C1500,680 1560,700 1600,690 '
  + 'L1600,900 L0,900 Z';

const HILL_VERTICAL_OFFSET = 40;

// Rendered via a portal straight into document.body and pinned with
// position:fixed so it never moves with page scroll, no matter which page
// it's mounted from (mounted once in Layout, above every route).
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
