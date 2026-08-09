// Shared SVG path data for the mountain/hill scene, used by both the
// scroll-parallax version (MountainBackground, on Home) and the static
// version (StaticMountainScene, on Profile) so the two stay visually
// consistent without duplicating hand-tuned coordinates.

export const FAR_MOUNTAINS_PATH = 'M0,260 L180,120 L330,220 L520,90 L720,230 L900,140 L1080,235 L1260,150 '
  + 'L1440,225 L1600,170 L1600,900 L0,900 Z';

export const MID_MOUNTAINS_PATH = 'M0,340 L160,210 L300,300 L480,170 L660,320 L840,210 L1020,310 L1200,220 '
  + 'L1380,300 L1600,250 L1600,900 L0,900 Z';

// Single smooth curve (Catmull-Rom-derived, so the joins between segments
// have no visible kink) used as the hill's own boundary. Crests at ~33%
// across, then eases down further right so more sky/mountain shows there.
export const HILL_CURVE = 'M0,300 C177,293 372,258 530,280 C688,302 822,383 950,430 '
  + 'C1078,477 1192,542 1300,560 C1408,578 1500,547 1600,540';

export const FRONT_CHARCOAL_PATH = 'M0,780 C300,700 520,760 760,720 C980,680 1180,740 1400,700 C1500,680 1560,700 1600,690 '
  + 'L1600,900 L0,900 Z';
