import { useState } from 'react';
import { Avatar, Box, Tooltip } from '@mantine/core';
import type { FarmProgress } from '@shared/api/models/farm.model';
import level1Pieter from '../assets/farmers/level-1-pieter.png';
import level2Nomsa from '../assets/farmers/level-2-nomsa.png';
import level3Willem from '../assets/farmers/level-3-willem.png';

interface FarmRoadProps {
  farms: FarmProgress[];
}

const roadPositions = [
  {
    top: '12%', left: '6%'
  },
  {
    top: '50%', left: '50%'
  },
  {
    top: '91%', left: '93%'
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

function FarmRoad({ farms }: FarmRoadProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const nextFarmId = farms.find((farm) => !farm.visited)?.id;

  const pins = farms.slice(0, roadPositions.length).map((farm, i) => ({
    ...farm, ...roadPositions[i]
  }));

  return (
    <Box
      pos="relative"
      w="100%"
      maw={580}
      h={420}
      mx="auto"
    >
      <svg
        viewBox="0 0 460 340"
        width="100%"
        height="100%"
        aria-hidden="true"
      >
        <path
          d="M30,30 C90,60 120,130 230,170 C300,200 360,250 430,300"
          fill="none"
          stroke="var(--mantine-color-charcoal-4)"
          strokeWidth={12}
          strokeLinecap="round"
        />
        <path
          d="M30,30 C90,60 120,130 230,170 C300,200 360,250 430,300"
          fill="none"
          stroke="var(--mantine-color-mustard-1)"
          strokeWidth={4}
          strokeDasharray="16 14"
          strokeLinecap="round"
        />
      </svg>
      {pins.map((farm) => {
        const isHovered = hoveredId === farm.id;
        const isDimmed = hoveredId !== null && !isHovered;
        const isNextStep = farm.id === nextFarmId;

        return (
          <Box
            key={farm.id}
            pos="absolute"
            top={farm.top}
            left={farm.left}
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            {isNextStep && (
              <Box
                pos="absolute"
                top="50%"
                left="50%"
                style={{
                  width: avatarSize + 6,
                  height: avatarSize + 6,
                  borderRadius: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'radial-gradient(circle, var(--mantine-color-mustard-5) 0%, var(--mantine-color-mustard-4) 55%, transparent 75%)',
                  animation: 'farm-next-glow 3.6s ease-in-out infinite',
                  pointerEvents: 'none'
                }}
              />
            )}
            <Tooltip
              label={`${farm.name} — ${farm.visited ? 'Visited' : 'Not visited yet'}`}
              withArrow
            >
              <Box
                pos="relative"
                onMouseEnter={() => setHoveredId(farm.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: farm.visited ? 'var(--mantine-color-moss-6)' : 'var(--mantine-color-terracotta-1)',
                  border: `3px solid ${farm.visited ? 'var(--mantine-color-moss-8)' : 'var(--mantine-color-terracotta-5)'}`,
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
