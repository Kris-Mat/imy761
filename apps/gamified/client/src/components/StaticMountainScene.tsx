import { createPortal } from 'react-dom';
import {
  FAR_HILL, FRONT_HILL, MID_HILL, SKY_GRADIENT, type HillCircle
} from '../lib/hillGeometry';

function Hill({ hill }: { hill: HillCircle; }) {
  return (
    <div
      style={{
        position: 'absolute', left: hill.left, right: hill.right, bottom: hill.bottom, height: hill.height, borderRadius: '50%', background: hill.color
      }}
    />
  );
}

// Same warm backdrop as the Quests redesign mockup (see lib/hillGeometry.ts)
// — no scroll-parallax, no camera pan, just the static scene.
//
// Rendered via a portal straight into document.body: Layout's ScrollSmoother
// applies a CSS transform to #smooth-content to fake smooth scrolling, and a
// transformed ancestor turns `position: fixed` descendants into
// `position: absolute` relative to it (per spec) — so from inside that
// subtree this would scroll with the page instead of staying put. Escaping
// to body sidesteps that entirely.
function StaticMountainScene() {
  return createPortal(
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', background: SKY_GRADIENT
      }}
    >
      <Hill hill={FAR_HILL} />
      <Hill hill={MID_HILL} />
      <Hill hill={FRONT_HILL} />
    </div>,
    document.body
  );
}

export default StaticMountainScene;
