// Split out of components/QuestScene.tsx because a file with a component
// default export can only export other components (react-refresh/only-
// export-components) — same reason lib/heroParallax.ts exists.

// A single shared "camera" the whole scene reads from — where cameraTarget
// changes (farm selected/deselected), every layer recalculates its own
// translate+scale off the SAME target, just at a different depth
// multiplier. That's what produces the parallax: distant layers move less,
// foreground (and the flags) move almost as much as the camera itself.
export interface CameraTarget {
  xPct: number; // 0-100, focus point as % of the scene's own width
  yPct: number; // 0-100
  zoom: number; // 1 = neutral/zoomed out
}

export const NEUTRAL_CAMERA: CameraTarget = {
  xPct: 50, yPct: 55, zoom: 1
};

// Fixed scene coordinates for the three farm stations — same convention as
// heroParallax's ROAD_PIN_POSITIONS (index i = the i-th farm once sorted by
// orderIndex), but freshly authored for this scene's own percentage space
// rather than converted from ROAD_PIN_POSITIONS. That data was computed for
// Home's specific 1600x900 SVG viewBox + "slice" cropping + scroll-transform
// math; this scene positions its hills with plain CSS percentages instead
// (see lib/hillGeometry.ts), a different coordinate system the SVG-specific
// numbers don't convert cleanly into. The three points below sit along
// FRONT_HILL's own visible crest (its high point works out to ~39% across,
// ~78% down), spreading right and down from there — the same "recede along
// the hill" arrangement ROAD_PIN_POSITIONS uses, just re-derived for this
// scene's own units so it's still the same *place*, drawn with the same
// hill geometry, even though the exact pin coordinates aren't shared code.
export const FARM_STATIONS: { xPct: number; yPct: number; }[] = [
  {
    xPct: 48, yPct: 80
  },
  {
    xPct: 66, yPct: 85
  },
  {
    xPct: 84, yPct: 90
  }
];

// How strongly each depth layer reacts to the camera target — far layers
// barely move (they're "distant"). The flags are planted on FRONT_HILL and
// share its depth (0.5) rather than getting their own — in the mockup the
// front hill, its texture, and all three markers are literally one
// transformed group, so a marker never drifts off the hill it's standing on
// during a camera move.
export const DEPTH = {
  far: 0.12, mid: 0.28, hill: 0.5
} as const;

export const CAMERA_TRANSITION = 'transform 1100ms cubic-bezier(0.22, 1, 0.36, 1)';

export function layer(target: CameraTarget, depthMultiplier: number, size: { width: number; height: number; }): string {
  const dx = ((NEUTRAL_CAMERA.xPct - target.xPct) / 100) * size.width * depthMultiplier;
  const dy = ((NEUTRAL_CAMERA.yPct - target.yPct) / 100) * size.height * depthMultiplier;
  const scale = 1 + (target.zoom - 1) * depthMultiplier;
  return `translate(${dx}px, ${dy}px) scale(${scale})`;
}

export type FarmFlagState = 'selected' | 'none-selected' | 'other-selected';

// Matches the mockup's resting-state marker (opacity 0.34, scale 0.78) for
// "no farm picked yet"; a farm actively being viewed elsewhere fades
// further still so the selected one reads as the obvious focal point.
export function flagOpacity(state: FarmFlagState): number {
  if (state === 'selected') return 1;
  if (state === 'none-selected') return 0.34;
  return 0.18;
}

export function flagScale(state: FarmFlagState): number {
  return state === 'selected' ? 1 : 0.78;
}

// Distant sun + drifting cloud dressing for the far layer only — pulled out
// of QuestScene.tsx's JSX so the two cloud sizes/speeds live next to the
// rest of this scene's tuning constants.
export const SUN = {
  size: 70, top: '4%', right: '10%'
};

export const CLOUDS: { width: number; height: number; top: string; left: string; opacity: number; durationS: number; }[] = [
  {
    width: 104, height: 36, top: '10%', left: '58%', opacity: 0.75, durationS: 26
  },
  {
    width: 74, height: 26, top: '20%', left: '14%', opacity: 0.6, durationS: 34
  }
];
