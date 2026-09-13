// The fade duration Quests.tsx's own list<->farm-detail transition already
// uses (see its `selectFarm`) — pulled out here so PageFadeOutlet's global
// route fade reuses the exact same timing/easing instead of a second,
// separately-tuned value. Originally chosen as shorter than QuestScene's
// own ~1.1s camera transition (lib/questScene.ts's CAMERA_TRANSITION), so a
// foreground content swap finishes well before the background settles.
export const PAGE_FADE_MS = 300;

// Groups a pathname into the "page" it belongs to, ignoring the params that
// change within a single running quest (farmId/stepIndex) — used so the
// global fade only plays when the actual page changes (Home, Dashboard,
// Profile, the Quests list, Admin, or entering/leaving a quest run), not on
// every single step-to-step navigation while already inside one quest run,
// which already has its own reveal/feedback animation language from the
// juicy-feedback ticket's earlier phases.
export function pageKind(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return 'home';
  if (segments[0] === 'quests' && segments.length > 1) return 'quest-runner';
  return segments[0];
}
