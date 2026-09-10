// Shared between MountainBackground and FarmRoad. Split into its own file
// because a file with a component default export can only export other
// components (react-refresh/only-export-components).

// The pins overlay in FarmRoad is a plain DOM layer, not part of the hill's
// SVG, so it needs the same scroll distance applied to its own tween to
// stay visually locked onto the road drawn on the hill.
export const HILL_PARALLAX_DISTANCE = 130;

// Percentage positions sitting just above MountainBackground's road (the
// front hill ellipse's own boundary, offset down slightly — see ROAD_CURVE
// there), evenly spaced along x across the road's visible span (x=950..1600
// of the 1600x900 viewBox). Keep in sync if that curve changes.
export const ROAD_PIN_POSITIONS = [
  {
    top: '71%', left: '66%'
  },
  {
    top: '75%', left: '78%'
  },
  {
    top: '81%', left: '91%'
  }
];
