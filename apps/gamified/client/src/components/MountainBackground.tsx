import { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { HILL_PARALLAX_DISTANCE } from '../lib/heroParallax';

interface MountainBackgroundProps {
  heroSectionRef: React.RefObject<HTMLDivElement | null>;
}

// Same three soft hill ellipses as StaticMountainScene (the redesigned
// Quests page's background, now used app-wide) — cx/cy/rx/ry below are that
// design's CSS recipe (left/right/bottom/height percentages of the 1600x900
// viewBox, border-radius: 50%) converted to ellipse geometry, not the old
// jagged mountain-peak paths. No front "charcoal ground" layer either,
// matching that same redesign. All three cy values (and ROAD_CURVE below)
// are shifted 150 units up from that original recipe so the hill/road sits
// higher in the frame, level with the welcome text rather than low near the
// bottom edge — matched by the same ~17-point shift on ROAD_PIN_POSITIONS
// in heroParallax.ts, so the markers stay on the road.
const FAR_HILL = {
  cx: 800, cy: 768, rx: 992, ry: 324
};
const MID_HILL = {
  cx: 880, cy: 831, rx: 1200, ry: 333
};
const FRONT_HILL = {
  cx: 624, cy: 903, rx: 1104, ry: 351
};

// Hand-fit to FRONT_HILL's own boundary (y = cy - ry*sqrt(1-((x-cx)/rx)^2)),
// nudged down ~18 units so the road reads as sitting on the hill rather than
// floating exactly on its edge. Starts at x=950 — same reasoning as before,
// the road only starts once the hero text column has cleared (~49% across)
// so it never runs behind the welcome message/avatar.
const ROAD_CURVE = 'M950,586 C1030,594 1100,600 1200,622 '
  + 'C1300,644 1420,676 1500,707 C1550,725 1580,743 1600,757';

function MountainBackground({ heroSectionRef }: MountainBackgroundProps) {
  const farRef = useRef<SVGEllipseElement>(null);
  const midRef = useRef<SVGEllipseElement>(null);
  const hillRoadRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!heroSectionRef.current) return undefined;

    const layers = [
      {
        el: farRef.current, distance: 25
      },
      {
        el: midRef.current, distance: 55
      },
      {
        el: hillRoadRef.current, distance: HILL_PARALLAX_DISTANCE
      }
    ];

    const ctx = gsap.context(() => {
      layers.forEach(({ el, distance }) => {
        if (!el) return;
        gsap.to(el, {
          y: distance,
          ease: 'none',
          scrollTrigger: {
            trigger: heroSectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true
          }
        });
      });
    });

    return () => ctx.revert();
  }, [heroSectionRef]);

  return (
    <svg
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0
      }}
    >
      <defs>
        <linearGradient
          id="heroSkyGradient"
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop
            offset="0%"
            stopColor="#fdf8ee"
          />
          <stop
            offset="55%"
            stopColor="#f5ead8"
          />
          <stop
            offset="100%"
            stopColor="#f0e4cd"
          />
        </linearGradient>
      </defs>
      <rect
        width={1600}
        height={900}
        fill="url(#heroSkyGradient)"
      />
      <ellipse
        ref={farRef}
        cx={FAR_HILL.cx}
        cy={FAR_HILL.cy}
        rx={FAR_HILL.rx}
        ry={FAR_HILL.ry}
        fill="#e1eecc"
      />
      <ellipse
        ref={midRef}
        cx={MID_HILL.cx}
        cy={MID_HILL.cy}
        rx={MID_HILL.rx}
        ry={MID_HILL.ry}
        fill="#ccdbb2"
      />
      <g ref={hillRoadRef}>
        <ellipse
          cx={FRONT_HILL.cx}
          cy={FRONT_HILL.cy}
          rx={FRONT_HILL.rx}
          ry={FRONT_HILL.ry}
          fill="#aebf92"
        />
        <path
          d={ROAD_CURVE}
          fill="none"
          stroke="var(--mantine-color-terracotta-9)"
          strokeWidth={16}
          strokeLinecap="round"
        />
        <circle
          cx={950}
          cy={586}
          r={12}
          fill="var(--mantine-color-terracotta-9)"
        />
      </g>
    </svg>
  );
}

export default MountainBackground;
