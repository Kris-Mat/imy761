import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Avatar, Box, Tooltip } from '@mantine/core';
import type { FarmProgress } from '@shared/api/models/farm.model';
import level1Pieter from '../assets/farmers/level-1-pieter.png';
import level2Nomsa from '../assets/farmers/level-2-nomsa.png';
import level3Willem from '../assets/farmers/level-3-willem.png';
import { gsap } from '../lib/gsap';
import { HILL_PARALLAX_DISTANCE, ROAD_PIN_POSITIONS } from '../lib/heroParallax';

interface FarmRoadProps {
  farms: FarmProgress[];
  heroSectionRef: React.RefObject<HTMLDivElement | null>;
}

// Stand-in so the road has pins to show while /users/me/farms is 500ing —
// remove once the backend sync issue is fixed.
const FALLBACK_FARMS: FarmProgress[] = [
  {
    id: -1, name: 'Redridge Farm', farmerName: 'Pieter', orderIndex: 1, visited: true, completed: true, scorePercent: 82, questions: []
  },
  {
    id: -2, name: 'Green Valley Farm', farmerName: 'Nomsa', orderIndex: 2, visited: false, completed: false, scorePercent: null, questions: []
  },
  {
    id: -3, name: 'Sunrise Farm', farmerName: 'Willem', orderIndex: 3, visited: false, completed: false, scorePercent: null, questions: []
  }
];

// Keyed by orderIndex (levelNumber) — the portrait is a presentation
// concern, not something the API needs to know about.
const farmerImages: Record<number, string> = {
  1: level1Pieter,
  2: level2Nomsa,
  3: level3Willem
};

const avatarSize = 104;
const photoSize = avatarSize - 14;

function tooltipLabel(farm: FarmProgress) {
  if (farm.scorePercent !== null) return `${farm.name} — ${farm.scorePercent}%`;
  if (farm.visited) return `${farm.name} — Visited`;
  return `${farm.name} — Not visited yet`;
}

function FarmRoad({ farms, heroSectionRef }: FarmRoadProps) {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const effectiveFarms = farms.length > 0 ? farms : FALLBACK_FARMS;
  const pins = effectiveFarms.slice(0, ROAD_PIN_POSITIONS.length).map((farm, i) => ({
    ...farm, ...ROAD_PIN_POSITIONS[i]
  }));

  useEffect(() => {
    if (!heroSectionRef.current || !overlayRef.current) return undefined;

    // Same distance as the hill+road layer in MountainBackground so the
    // pins stay visually locked onto the road during the scroll parallax.
    const ctx = gsap.context(() => {
      gsap.to(overlayRef.current, {
        y: HILL_PARALLAX_DISTANCE,
        ease: 'none',
        scrollTrigger: {
          trigger: heroSectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    });

    return () => ctx.revert();
  }, [heroSectionRef]);

  return (
    <Box
      ref={overlayRef}
      pos="absolute"
      inset={0}
      style={{ zIndex: 1 }}
    >
      {pins.map((farm) => {
        const isHovered = hoveredId === farm.id;
        const isDimmed = hoveredId !== null && !isHovered;

        return (
          <Box
            key={farm.id}
            pos="absolute"
            top={farm.top}
            left={farm.left}
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <Tooltip
              label={tooltipLabel(farm)}
              withArrow
            >
              <Box
                pos="relative"
                onMouseEnter={() => setHoveredId(farm.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => navigate(`/quests/${farm.id}/0`)}
                style={{
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: farm.visited ? 'var(--mantine-color-moss-6)' : 'var(--mantine-color-terracotta-1)',
                  border: `3px solid ${farm.visited ? 'var(--mantine-color-moss-8)' : 'var(--mantine-color-terracotta-7)'}`,
                  cursor: 'pointer',
                  transform: `scale(${isHovered ? 1.2 : 1})`,
                  opacity: isDimmed ? 0.55 : 1,
                  transition: 'transform 150ms ease, opacity 150ms ease'
                }}
              >
                <Avatar
                  src={farmerImages[farm.orderIndex]}
                  alt={farm.name}
                  size={photoSize}
                  radius="50%"
                  imageProps={{ style: {
                    objectFit: 'cover', objectPosition: '50% 15%'
                  } }}
                />
              </Box>
            </Tooltip>
          </Box>
        );
      })}
    </Box>
  );
}

export default FarmRoad;
