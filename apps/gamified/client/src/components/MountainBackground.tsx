import { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';
import { HILL_PARALLAX_DISTANCE, HILL_VERTICAL_OFFSET } from '../lib/heroParallax';
import {
  FAR_MOUNTAINS_PATH, FRONT_CHARCOAL_PATH, HILL_CURVE, MID_MOUNTAINS_PATH
} from '../lib/hillShapes';

interface MountainBackgroundProps {
  heroSectionRef: React.RefObject<HTMLDivElement | null>;
}

// The road only starts once the hero text column has cleared (~49% across)
// so it never runs behind the welcome message/avatar. From x=950 onward it
// reuses the exact same points as HILL_CURVE, so the two stay in lockstep;
// only the lead-in segment (before the text clears) differs.
const ROAD_CURVE = 'M780,358 C837,382 863,396 950,430 '
  + 'C1037,464 1192,542 1300,560 C1408,578 1500,547 1600,540';
const ROAD_OFFSET = 45;

function MountainBackground({ heroSectionRef }: MountainBackgroundProps) {
  const farRef = useRef<SVGPathElement>(null);
  const midRef = useRef<SVGPathElement>(null);
  const hillRoadRef = useRef<SVGGElement>(null);
  const frontRef = useRef<SVGPathElement>(null);

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
      },
      {
        el: frontRef.current, distance: 170
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
      <rect
        width={1600}
        height={900}
        fill="var(--mantine-color-sky-0)"
      />
      <path
        ref={farRef}
        d={FAR_MOUNTAINS_PATH}
        fill="var(--mantine-color-moss-1)"
      />
      <path
        ref={midRef}
        d={MID_MOUNTAINS_PATH}
        fill="var(--mantine-color-moss-2)"
      />
      {/* Outer group is a static vertical nudge; inner group is what scroll-parallax animates. */}
      <g transform={`translate(0, ${HILL_VERTICAL_OFFSET})`}>
        <g ref={hillRoadRef}>
          <path
            d={`${HILL_CURVE} L1600,900 L0,900 Z`}
            fill="var(--mantine-color-moss-4)"
          />
          <path
            d={ROAD_CURVE}
            transform={`translate(0, ${ROAD_OFFSET})`}
            fill="none"
            stroke="var(--mantine-color-terracotta-9)"
            strokeWidth={16}
            strokeLinecap="round"
          />
          <circle
            cx={780}
            cy={358 + ROAD_OFFSET}
            r={12}
            fill="var(--mantine-color-terracotta-9)"
          />
        </g>
      </g>
      <path
        ref={frontRef}
        d={FRONT_CHARCOAL_PATH}
        fill="var(--mantine-color-charcoal-5)"
      />
    </svg>
  );
}

export default MountainBackground;
