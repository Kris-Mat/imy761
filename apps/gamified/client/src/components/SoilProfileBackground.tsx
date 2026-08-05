import { useEffect, useRef } from 'react';
import { gsap } from '../lib/gsap';

type Point = [number, number];

const boundary1: Point[] = [
  [0, 90], [160, 82], [320, 100], [480, 84], [640, 102], [800, 80],
  [960, 98], [1120, 86], [1280, 99], [1440, 83], [1600, 93]
];
const boundary2: Point[] = [
  [0, 260], [160, 270], [320, 252], [480, 274], [640, 250], [800, 267],
  [960, 248], [1120, 269], [1280, 254], [1440, 271], [1600, 260]
];
const boundary3: Point[] = [
  [0, 470], [160, 458], [320, 479], [480, 456], [640, 481], [800, 462],
  [960, 483], [1120, 461], [1280, 477], [1440, 459], [1600, 470]
];
const boundary4: Point[] = [
  [0, 680], [160, 689], [320, 669], [480, 693], [640, 671], [800, 688],
  [960, 667], [1120, 690], [1280, 673], [1440, 692], [1600, 680]
];

function linePath(points: Point[]) {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
}

const bladeOffsets = [90, 82, 100, 84, 102, 80, 98, 86, 99, 83, 93, 88, 96, 85, 101, 79];
const bladeHeights = [30, 42, 26, 38, 32, 44, 28, 36, 30, 40, 34, 46, 28, 38, 32, 42];

const grassBlades = bladeOffsets.map((baseY, i) => {
  const x = 40 + i * 100;
  const height = bladeHeights[i];
  return {
    key: `blade-${x}`, d: `M${x - 7},${baseY} L${x},${baseY - height} L${x + 7},${baseY}` 
  };
});

const speckleOffsetsX = [70, 210, 360, 500, 640, 780, 920, 1060, 1200, 1340, 1480, 1560];

const subsoilSpeckles = speckleOffsetsX.map((x, i) => ({
  key: `subsoil-speckle-${x}`,
  cx: x,
  cy: 300 + ((i % 4) * 40),
  r: 5 + (i % 3)
}));

const claySpeckles = speckleOffsetsX.map((x, i) => ({
  key: `clay-speckle-${x}`,
  cx: (x + 60) % 1600,
  cy: 520 + ((i % 4) * 36),
  r: 4 + (i % 3)
}));

const bedrockCracks = [
  'M60,720 L220,780 L180,860',
  'M300,700 L340,790 L460,750',
  'M520,860 L560,760 L680,820',
  'M700,700 L780,760 L740,850',
  'M900,780 L980,720 L1080,790',
  'M1080,860 L1140,780 L1260,830',
  'M1300,710 L1360,800 L1480,760',
  'M1450,860 L1520,780 L1580,850'
];

const outlineColor = 'var(--mantine-color-charcoal-3)';

interface SoilProfileBackgroundProps {
  statsSectionRef: React.RefObject<HTMLDivElement | null>;
}

function SoilProfileBackground({ statsSectionRef }: SoilProfileBackgroundProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !statsSectionRef.current) return undefined;

    const ctx = gsap.context(() => {
      const shapes = svgRef.current!.querySelectorAll<SVGPathElement | SVGCircleElement>('path, circle');
      shapes.forEach((shape) => {
        const length = shape.getTotalLength();
        gsap.set(shape, {
          strokeDasharray: length, strokeDashoffset: length
        });
      });

      gsap.to(shapes, {
        strokeDashoffset: 0,
        ease: 'none',
        stagger: 0.015,
        scrollTrigger: {
          trigger: statsSectionRef.current,
          start: 'top 85%',
          end: 'top 15%',
          scrub: true
        }
      });
    }, svgRef);

    return () => ctx.revert();
  }, [statsSectionRef]);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1600 900"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0
      }}
    >
      {grassBlades.map((blade) => (
        <path
          key={blade.key}
          d={blade.d}
          fill="none"
          stroke={outlineColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      <path
        d={linePath(boundary1)}
        fill="none"
        stroke={outlineColor}
        strokeWidth={2}
      />
      <path
        d={linePath(boundary2)}
        fill="none"
        stroke={outlineColor}
        strokeWidth={2}
      />
      <path
        d={linePath(boundary3)}
        fill="none"
        stroke={outlineColor}
        strokeWidth={2}
      />
      <path
        d={linePath(boundary4)}
        fill="none"
        stroke={outlineColor}
        strokeWidth={2}
      />

      {subsoilSpeckles.map((speckle) => (
        <circle
          key={speckle.key}
          cx={speckle.cx}
          cy={speckle.cy}
          r={speckle.r}
          fill="none"
          stroke={outlineColor}
          strokeWidth={1.5}
        />
      ))}
      {claySpeckles.map((speckle) => (
        <circle
          key={speckle.key}
          cx={speckle.cx}
          cy={speckle.cy}
          r={speckle.r}
          fill="none"
          stroke={outlineColor}
          strokeWidth={1.5}
        />
      ))}

      {bedrockCracks.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke={outlineColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

export default SoilProfileBackground;
