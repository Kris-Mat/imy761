import { createPortal } from 'react-dom';

// Same warm backdrop as the Quests redesign mockup: a cream gradient sky
// with three large overlapping circles anchored off the bottom edge, their
// tops peeking up as soft rolling hills — not the jagged mountain-peak SVG
// silhouette MountainBackground draws on Home. That shape is deliberately
// left alone here: its road + farm pins overlay is calibrated to the exact
// HILL_CURVE path, and swapping the hill shape under it would need that
// whole system re-tuned, not just recoloured. Every other page (Profile,
// Quests, Dashboard, QuestRunner, Admin) uses this static scene, so this
// change alone covers the app's non-Home backdrop.
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
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #fdf8ee 0%, #f5ead8 55%, #f0e4cd 100%)'
      }}
    >
      <div
        style={{
          position: 'absolute', left: '-12%', right: '-12%', bottom: '-38vh', height: '72vh', borderRadius: '50%', background: '#e1eecc'
        }}
      />
      <div
        style={{
          position: 'absolute', left: '-20%', right: '-30%', bottom: '-46vh', height: '74vh', borderRadius: '50%', background: '#ccdbb2'
        }}
      />
      <div
        style={{
          position: 'absolute', left: '-30%', right: '-8%', bottom: '-56vh', height: '78vh', borderRadius: '50%', background: '#aebf92'
        }}
      />
    </div>,
    document.body
  );
}

export default StaticMountainScene;
