// Shared between MountainBackground and FarmRoad. Split into its own file
// because a file with a component default export can only export other
// components (react-refresh/only-export-components).

// The pins overlay in FarmRoad is a plain DOM layer, not part of the hill's
// SVG, so it needs the same scroll distance applied to its own tween to
// stay visually locked onto the road drawn on the hill.
export const HILL_PARALLAX_DISTANCE = 130;

// Static downward shift (SVG units, out of the 900-tall viewBox) applied to
// the whole hill+road+icons group. Purely a vertical nudge — doesn't affect
// the shapes themselves.
export const HILL_VERTICAL_OFFSET = 40;

// Percentage positions sitting above the road drawn in MountainBackground
// (ROAD_CURVE + ROAD_OFFSET + HILL_VERTICAL_OFFSET), evenly spaced along x,
// starting only once the road itself starts (past the hero text column).
// Keep in sync if that curve changes.
export const ROAD_PIN_POSITIONS = [
  { top: '36%', left: '56%' },
  { top: '51%', left: '74%' },
  { top: '55%', left: '92%' }
];
