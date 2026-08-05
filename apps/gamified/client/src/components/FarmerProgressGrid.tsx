import { Avatar, Group, Stack, Text } from '@mantine/core';
import type { FarmProgress } from '@shared/api/models/farm.model';
import level1Pieter from '../assets/farmers/level-1-pieter.png';
import level2Nomsa from '../assets/farmers/level-2-nomsa.png';
import level3Willem from '../assets/farmers/level-3-willem.png';

interface FarmerProgressGridProps {
  farms: FarmProgress[];
}

// Keyed by orderIndex (levelNumber), matching the same convention as
// FarmRoad.tsx — the portrait is a presentation concern, not something the
// API needs to know about.
const farmerImages: Record<number, string> = {
  1: level1Pieter,
  2: level2Nomsa,
  3: level3Willem
};

const badgeSize = 76;
const photoSize = badgeSize - 10;

function FarmerBadge({ farm }: { farm: FarmProgress; }) {
  return (
    <Stack
      gap={6}
      align="center"
      w={92}
    >
      <Avatar
        src={farmerImages[farm.orderIndex]}
        alt={farm.farmerName}
        size={badgeSize}
        radius="50%"
        style={{
          border: farm.completed
            ? '3px solid var(--mantine-color-mustard-5)'
            : '3px solid var(--mantine-color-charcoal-2)',
          boxShadow: farm.completed ? '0 0 0 3px var(--mantine-color-mustard-1)' : 'none',
          opacity: farm.completed ? 1 : 0.35,
          filter: farm.completed ? 'none' : 'grayscale(60%)',
          transition: 'opacity 200ms ease, box-shadow 200ms ease'
        }}
        imageProps={{ style: {
          objectFit: 'cover', objectPosition: '50% 15%', width: photoSize, height: photoSize
        } }}
      />
      <Text
        fz="xs"
        fw={500}
        c="charcoal.7"
        ta="center"
        lineClamp={1}
      >
        {farm.farmerName}
      </Text>
    </Stack>
  );
}

function FarmerProgressGrid({ farms }: FarmerProgressGridProps) {
  return (
    <Group
      gap="lg"
      align="flex-start"
    >
      {farms.map((farm) => (
        <FarmerBadge
          key={farm.id}
          farm={farm}
        />
      ))}
    </Group>
  );
}

export default FarmerProgressGrid;
