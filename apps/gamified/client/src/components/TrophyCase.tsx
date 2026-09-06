import { Paper, SimpleGrid, Stack, Text } from '@mantine/core';
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

// Locked/unlocked treatment mirrors FarmerProgressGrid.tsx's badge styling
// (reduced opacity + grayscale + muted border when incomplete, full colour +
// accent border + glow when complete) so trophies read as the same visual
// language as farmer progress badges.
function TrophyBadge({ achievement }: { achievement: Achievement; }) {
  const { earned } = achievement;
  return (
    <Paper
      radius="md"
      p="md"
      style={{
        border: earned ? '2px solid var(--mantine-color-mustard-5)' : '2px solid var(--mantine-color-charcoal-2)',
        boxShadow: earned ? '0 0 0 3px var(--mantine-color-mustard-1)' : 'none',
        opacity: earned ? 1 : 0.4,
        filter: earned ? 'none' : 'grayscale(70%)',
        transition: 'opacity 200ms ease, box-shadow 200ms ease'
      }}
    >
      <Stack
        gap={6}
        align="center"
        ta="center"
      >
        <Icon
          name="Trophy"
          size={36}
          weight={earned ? 'fill' : 'regular'}
          color={earned ? 'var(--mantine-color-mustard-6)' : 'var(--mantine-color-charcoal-4)'}
        />
        <Text
          fz="sm"
          fw={700}
          c="charcoal.9"
        >
          {achievement.title}
        </Text>
        <Text
          fz="xs"
          c="charcoal.6"
        >
          {achievement.description}
        </Text>
        {earned && achievement.earnedAt && (
          <Text
            fz="xs"
            fw={600}
            c="mustard.7"
          >
            Earned
            {' '}
            {formatEarnedAt(achievement.earnedAt)}
          </Text>
        )}
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
