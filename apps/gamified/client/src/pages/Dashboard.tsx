import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Avatar, Box, Button, Divider, Group, Loader, Paper, Progress, SimpleGrid, Stack, Text, Title
} from '@mantine/core';
import { LoadingPage } from '@shared/ui/LoadingPage';
import type { FarmProgress } from '@shared/api/models/farm.model';
import type { CategoryAccuracy } from '@shared/api/models/user-stats.model';
import type { Monolith } from '@shared/api/models/monolith.model';
import { useUser } from '../context/UserContext';
import { useMonoliths } from '../hooks/useMonoliths';
import { hasAttempted, hasFinished } from '../lib/questProgress';
import { categoryLabels } from '../lib/questionCategory';
import StatCard from '../components/StatCard';
import TrophyCase from '../components/TrophyCase';
import FarmerProgressGrid from '../components/FarmerProgressGrid';
import StaticMountainScene from '../components/StaticMountainScene';
import level1Pieter from '../assets/farmers/level-1-pieter.png';
import level2Nomsa from '../assets/farmers/level-2-nomsa.png';
import level3Willem from '../assets/farmers/level-3-willem.png';

// Keyed by orderIndex (levelNumber), matching the convention in FarmRoad.tsx,
// FarmerProgressGrid.tsx and Quests.tsx.
const farmerImages: Record<number, string> = {
  1: level1Pieter,
  2: level2Nomsa,
  3: level3Willem
};

const TROPHY_PREVIEW_LIMIT = 4;

function accuracyColor(accuracyPercent: number | null): string {
  if (accuracyPercent === null) return 'gray';
  return accuracyPercent >= 75 ? 'moss' : 'terracotta';
}

function CategoryBreakdown({ categoryAccuracy }: { categoryAccuracy: CategoryAccuracy[]; }) {
  if (categoryAccuracy.length === 0) {
    return (
      <Text
        fz="sm"
        c="charcoal.6"
      >
        No category data yet — answer a few questions to see a breakdown here.
      </Text>
    );
  }

  return (
    <Stack gap="lg">
      {categoryAccuracy.map((entry) => (
        <Stack
          key={entry.category}
          gap={6}
        >
          <Group justify="space-between">
            <Text
              fw={600}
              c="charcoal.8"
            >
              {categoryLabels[entry.category]}
            </Text>
            <Text
              fz="sm"
              c="charcoal.6"
            >
              {entry.accuracyPercent !== null
                ? `${entry.accuracyPercent}% (${entry.correct}/${entry.attempted} correct)`
                : 'Not attempted'}
            </Text>
          </Group>
          <Progress
            value={entry.accuracyPercent ?? 0}
            color={accuracyColor(entry.accuracyPercent)}
            size="lg"
            radius="xl"
          />
        </Stack>
      ))}
    </Stack>
  );
}

// The step to resume at is the first question in the monolith's ordered
// question list that this farm has no correct-or-incorrect answer for yet —
// mirrors how Quests.tsx resolves each question row's target, since
// FarmProgress.questions is keyed by questionId, not position.
function findResumeStepIndex(farm: FarmProgress, monolith: Monolith | undefined): number {
  if (!monolith) return 0;
  const stepIndex = monolith.questions.findIndex((question) => {
    const progress = farm.questions.find((entry) => entry.questionId === question.id);
    return !progress || progress.isCorrect === null;
  });
  return stepIndex === -1 ? 0 : stepIndex;
}

function ContinueQuestCard({ farms, monoliths, monolithsLoading }: {
  farms: FarmProgress[];
  monoliths: Monolith[];
  monolithsLoading: boolean;
}) {
  const navigate = useNavigate();

  const sortedFarms = useMemo(
    () => [...farms].sort((a, b) => a.orderIndex - b.orderIndex),
    [farms]
  );
  const inProgressFarm = sortedFarms.find((farm) => hasAttempted(farm) && !hasFinished(farm));
  const nextUnstartedFarm = sortedFarms.find((farm) => !hasAttempted(farm));
  const allFinished = sortedFarms.length > 0 && sortedFarms.every(hasFinished);

  if (monolithsLoading) {
    return <Loader color="terracotta" />;
  }

  if (inProgressFarm) {
    const monolith = monoliths.find((m) => m.orderIndex === inProgressFarm.orderIndex);
    const stepIndex = findResumeStepIndex(inProgressFarm, monolith);
    return (
      <Group justify="space-between">
        <Group>
          <Avatar
            src={farmerImages[inProgressFarm.orderIndex]}
            alt={inProgressFarm.farmerName}
            size={56}
            radius="50%"
            imageProps={{ style: {
              objectFit: 'cover', objectPosition: '50% 15%'
            } }}
          />
          <Stack gap={0}>
            <Text
              fw={700}
              c="charcoal.9"
            >
              {inProgressFarm.name}
            </Text>
            <Text
              fz="sm"
              c="charcoal.6"
            >
              {inProgressFarm.scorePercent !== null ? `${inProgressFarm.scorePercent}% so far` : 'In progress'}
            </Text>
          </Stack>
        </Group>
        <Button
          color="terracotta"
          onClick={() => navigate(`/quests/${inProgressFarm.id}/${stepIndex}`)}
        >
          Continue Quest
        </Button>
      </Group>
    );
  }

  if (allFinished) {
    return (
      <Text c="charcoal.7">
        You&apos;ve completed every quest — great work! Revisit any of them from the Quests page.
      </Text>
    );
  }

  if (nextUnstartedFarm) {
    return (
      <Group justify="space-between">
        <Text c="charcoal.7">Ready to dig in? Your next quest is waiting.</Text>
        <Button
          color="terracotta"
          onClick={() => navigate(`/quests/${nextUnstartedFarm.id}/0`)}
        >
          Start Quest
        </Button>
      </Group>
    );
  }

  return (
    <Text c="charcoal.6">
      No quests available yet — check back soon.
    </Text>
  );
}

function DashboardContent() {
  const { stats, farms, achievements } = useUser();
  const { monoliths, loading: monolithsLoading } = useMonoliths();
  const navigate = useNavigate();

  const allFarms = farms ?? [];
  const completedFarms = allFarms.filter((farm) => farm.completed).length;
  const overallAccuracy = stats && stats.tasksCompleted > 0
    ? Math.round((stats.correctAnswers / stats.tasksCompleted) * 100)
    : null;

  return (
    <Box
      pos="relative"
      mih="100vh"
      style={{ overflow: 'hidden' }}
    >
      <StaticMountainScene />
      <Stack
        pos="relative"
        px="xl"
        pt={140}
        pb={80}
        maw={1100}
        mx="auto"
        gap="xl"
        style={{ zIndex: 1 }}
      >
        <Title
          order={1}
          c="charcoal.9"
        >
          Dashboard
        </Title>

        <Paper
          radius="lg"
          shadow="sm"
          p="xl"
          style={{ border: '1px solid var(--mantine-color-charcoal-2)' }}
        >
          {stats ? (
            <SimpleGrid
              cols={{
                base: 2, sm: 4
              }}
              spacing="lg"
            >
              <StatCard
                label="Quests Completed"
                value={`${completedFarms}/${allFarms.length}`}
              />
              <StatCard
                label="Overall Accuracy"
                value={overallAccuracy !== null ? `${overallAccuracy}%` : 'Not attempted'}
              />
              <StatCard
                label="Badges Earned"
                value={String(stats.badgesEarned)}
              />
              <StatCard
                label="Day Streak"
                value={String(stats.currentStreak)}
              />
            </SimpleGrid>
          ) : (
            <Loader color="terracotta" />
          )}
        </Paper>

        <Paper
          radius="lg"
          shadow="sm"
          p="xl"
          style={{ border: '1px solid var(--mantine-color-charcoal-2)' }}
        >
          <Text
            fz="xl"
            fw={700}
            c="charcoal.9"
            mb="lg"
          >
            Category Breakdown
          </Text>
          {stats ? (
            <CategoryBreakdown categoryAccuracy={stats.categoryAccuracy} />
          ) : (
            <Loader color="terracotta" />
          )}
        </Paper>

        <Paper
          radius="lg"
          shadow="sm"
          p="xl"
          style={{ border: '1px solid var(--mantine-color-charcoal-2)' }}
        >
          <Text
            fz="xl"
            fw={700}
            c="charcoal.9"
            mb="lg"
          >
            Continue Where You Left Off
          </Text>
          <ContinueQuestCard
            farms={allFarms}
            monoliths={monoliths}
            monolithsLoading={monolithsLoading}
          />
        </Paper>

        <Paper
          radius="lg"
          shadow="sm"
          p="xl"
          style={{ border: '1px solid var(--mantine-color-charcoal-2)' }}
        >
          <Text
            fz="xl"
            fw={700}
            c="charcoal.9"
            mb="lg"
          >
            Your Journey
          </Text>
          <FarmerProgressGrid farms={allFarms} />
        </Paper>

        <Paper
          radius="lg"
          shadow="sm"
          p="xl"
          style={{ border: '1px solid var(--mantine-color-charcoal-2)' }}
        >
          <Group
            justify="space-between"
            mb="lg"
          >
            <Text
              fz="xl"
              fw={700}
              c="charcoal.9"
            >
              Trophy Case
            </Text>
            <Button
              variant="subtle"
              color="terracotta"
              onClick={() => navigate('/profile?tab=achievements')}
            >
              View all
            </Button>
          </Group>
          <Divider mb="lg" />
          <TrophyCase
            achievements={achievements}
            limit={TROPHY_PREVIEW_LIMIT}
          />
        </Paper>
      </Stack>
    </Box>
  );
}

function Dashboard() {
  const { loading } = useUser();
  if (loading) return <LoadingPage />;
  return <DashboardContent />;
}

export default Dashboard;
