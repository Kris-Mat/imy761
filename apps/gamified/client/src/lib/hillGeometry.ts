// The warm cream-sky + three-soft-hill recipe used across every non-Home
// page (Profile, Quests, Dashboard, QuestRunner, Admin via
// StaticMountainScene) and — as ellipse geometry derived from these same
// percentages — Home's animated MountainBackground. Kept in one place so
// every page draws the same physical hill, not a second, separately-tuned
// illustration.
export const SKY_GRADIENT = 'linear-gradient(180deg, #fdf8ee 0%, #f5ead8 55%, #f0e4cd 100%)';

export interface HillCircle {
  left: string;
  right: string;
  bottom: string;
  height: string;
  color: string;
}

// bottom/height set so each hill's visible slice above the viewport's
// bottom edge (height + bottom, since bottom is negative) is a good ~14vh
// thicker than the one drawn on top of it — on a wide/short desktop
// viewport the old, closer-together values (72/-38, 74/-46, 78/-56, ~6vh
// apart) put only a ~60px sliver of FAR_HILL and MID_HILL above FRONT_HILL,
// thin enough that the three gradients read as one flat hill instead of a
// layered one. These wider gaps keep the banding visible regardless of
// viewport aspect ratio, not just on the narrow/tall viewport the mockup
// itself was authored for.
export const FAR_HILL: HillCircle = {
  left: '-12%', right: '-12%', bottom: '-30vh', height: '84vh', color: 'linear-gradient(160deg, #e6efd3, #d8e5be)'
};

export const MID_HILL: HillCircle = {
  left: '-20%', right: '-30%', bottom: '-42vh', height: '82vh', color: 'linear-gradient(160deg, #cfdeb4, #bccfa0)'
};

export const FRONT_HILL: HillCircle = {
  left: '-30%', right: '-8%', bottom: '-54vh', height: '80vh', color: 'linear-gradient(155deg, #b6c795, #9dae7c)'
};

// Diagonal-hatch texture laid over FRONT_HILL only (same geometry, drawn as
// a second circle) — the mockup's actual detail is here, not in the flat
// fill colour. Quests-only: StaticMountainScene's other pages keep the flat
// gradient hill without this texture.
export const FRONT_HILL_TEXTURE = 'repeating-linear-gradient(118deg, rgba(86, 99, 63, 0.12) 0px, rgba(86, 99, 63, 0.12) 3px, transparent 3px, transparent 42px)';
