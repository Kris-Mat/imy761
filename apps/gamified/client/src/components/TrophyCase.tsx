import {
  Box, Paper, SimpleGrid, Stack, Text
} from '@mantine/core';
import { Icon } from '@shared/ui/Icon';
import type { Achievement } from '@shared/api/models/achievement.model';

interface TrophyCaseProps {
  achievements: Achievement[];
  // When set, renders a condensed preview of only the `limit` most recently
  // earned achievements (locked ones omitted) instead of the full
  // locked+unlocked grid — used by Dashboard's trophy case preview, which
  // links through to the full case on Profile.
  limit?: number;
}

function formatEarnedAt(earnedAt: string) {
  return new Date(earnedAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

// Locked/unlocked treatment: a solid gold-tinted card with a spinning medal
// for an earned trophy, a pale dashed-border card with a greyed-out medal for
// a locked one — the same earned/locked split FarmerProgressGrid.tsx's badges
// draw, just in this card's own colour language instead of that one's.
function TrophyBadge({ achievement }: { achievement: Achievement; }) {
  const { earned } = achievement;
  return (
    <Paper
      radius="lg"
      py={22}
      px="md"
      bg={earned ? '#fdf3dd' : '#f7f2e8'}
      style={{
        border: earned ? '2px solid #e0b457' : '2px dashed var(--mantine-color-charcoal-2)'
      }}
    >
      <Stack
        gap={6}
        align="center"
        ta="center"
      >
        <Box
          w={50}
          h={50}
          mb={4}
          style={{
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: earned ? '#e0b457' : 'var(--mantine-color-charcoal-1)',
            animation: earned ? 'quest-flag-wave 4.2s ease-in-out infinite' : 'none'
          }}
        >
          <Icon
            name="Trophy"
            size={24}
            weight={earned ? 'fill' : 'regular'}
            color={earned ? '#fff8f1' : 'var(--mantine-color-charcoal-4)'}
          />
        </Box>
        <Text
          fz="sm"
          fw={700}
          c={earned ? 'charcoal.9' : 'charcoal.5'}
        >
          {achievement.title}
        </Text>
        <Text
          fz="xs"
          c={earned ? 'charcoal.6' : 'charcoal.4'}
        >
          {achievement.description}
        </Text>
        <Text
          fz={11}
          fw={800}
          mt={4}
          c={earned ? '#8a6420' : 'charcoal.4'}
        >
          {earned && achievement.earnedAt ? `Earned ${formatEarnedAt(achievement.earnedAt)}` : 'Not yet earned'}
        </Text>
      </Stack>
    </Paper>
  );
}

function TrophyCase({ achievements, limit }: TrophyCaseProps) {
  const displayed = limit
    ? achievements
      .filter((achievement) => achievement.earned && achievement.earnedAt)
      .sort((a, b) => new Date(b.earnedAt!).getTime() - new Date(a.earnedAt!).getTime())
      .slice(0, limit)
    : achievements;

  if (displayed.length === 0) {
    return (
      <Text
        fz="sm"
        c="charcoal.6"
      >
        {limit
          ? 'No achievements earned yet — keep playing to unlock some!'
          : 'No achievements to show yet — keep playing to unlock some!'}
      </Text>
    );
  }

  return (
    <SimpleGrid
      cols={{
        base: 2, sm: 3
      }}
      spacing="md"
    >
      {displayed.map((achievement) => (
        <TrophyBadge
          key={achievement.id}
          achievement={achievement}
        />
      ))}
    </SimpleGrid>
  );
}

export default TrophyCase;
