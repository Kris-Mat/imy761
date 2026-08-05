import { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';

interface MountainBackgroundProps {
  heroSectionRef: React.RefObject<HTMLDivElement | null>;
}

function MountainBackground({ heroSectionRef }: MountainBackgroundProps) {
  const farRef = useRef<SVGPathElement>(null);
  const midRef = useRef<SVGPathElement>(null);
  const nearRef = useRef<SVGPathElement>(null);
  const frontRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!heroSectionRef.current) return undefined;

    const layers = [
      {
        el: farRef.current, distance: 30 
      },
      {
        el: midRef.current, distance: 60 
      },
      {
        el: nearRef.current, distance: 110 
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
        fill="var(--mantine-color-terracotta-0)"
      />
      <path
        ref={farRef}
        d="M0,520 L260,260 L420,420 L620,180 L820,460 L980,300 L1140,480 L1300,340 L1460,470 L1600,380 L1600,900 L0,900 Z"
        fill="var(--mantine-color-moss-1)"
      />
      <path
        ref={midRef}
        d="M0,600 L220,420 L400,540 L640,320 L900,560 L1140,400 L1350,540 L1600,460 L1600,900 L0,900 Z"
        fill="var(--mantine-color-moss-2)"
      />
      <path
        ref={nearRef}
        d="M0,680 C260,600 420,660 600,600 C820,520 980,640 1200,580 C1380,540 1500,600 1600,580 L1600,900 L0,900 Z"
        fill="var(--mantine-color-moss-4)"
      />
      <path
        ref={frontRef}
        d="M0,780 C300,700 520,760 760,720 C980,680 1180,740 1400,700 C1500,680 1560,700 1600,690 L1600,900 L0,900 Z"
        fill="var(--mantine-color-charcoal-5)"
      />
    </svg>
  );
}

export default MountainBackground;
