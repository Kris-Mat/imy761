import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Avatar, Box, Button, Group, Loader, Paper, Stack, Text, Title
} from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import { LoadingPage } from '@shared/ui/LoadingPage';
import { Icon } from '@shared/ui/Icon';
import type { FarmProgress } from '@shared/api/models/farm.model';
import type { Monolith, QuestionCategory } from '@shared/api/models/monolith.model';
import type { Achievement } from '@shared/api/models/achievement.model';
import { useUser } from '../context/UserContext';
import { useMonoliths } from '../hooks/useMonoliths';
import { hasAttempted, hasFinished } from '../lib/questProgress';
import { categoryLabels } from '../lib/questionCategory';
import TrophyCase from '../components/TrophyCase';
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

const TROPHY_PREVIEW_LIMIT = 3;
const WEEK_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Purely decorative soil tones/depths for the five fixed QuestionCategory
// values — there's no per-question depth data to draw from, this is flavour
// text for the "profile pit" metaphor, same spirit as the mockup's own
// hand-picked ranges.
const PIT_LAYERS: { category: QuestionCategory; soilColor: string; depth: string; }[] = [
  {
    category: 'DIAGNOSTIC_HORIZONS', soilColor: '#6f4526', depth: '0–30 cm'
  },
  {
    category: 'SOIL_FORM', soilColor: '#8c5a33', depth: '30–60 cm'
  },
  {
    category: 'SOIL_FAMILY_CODE', soilColor: '#a9663a', depth: '60–90 cm'
  },
  {
    category: 'LANDSCAPE_POSITION', soilColor: '#b98a5b', depth: '90–120 cm'
  },
  {
    category: 'SUITABILITY', soilColor: '#8f9273', depth: '120–150 cm'
  }
];

// Fixed slots for up to three farms, laid out on JourneyPanel's own mini
// hill — same "recede up and to the right" arrangement as QuestScene's
// FARM_STATIONS, just re-tuned for this smaller card's own proportions.
const JOURNEY_PINS: { xPct: number; yPct: number; }[] = [
  {
    xPct: 17, yPct: 22
  },
  {
    xPct: 46, yPct: 42
  },
  {
    xPct: 75, yPct: 62
  }
];

interface PitRow {
  category: QuestionCategory;
  label: string;
  depth: string;
  soilColor: string;
  correct: number;
  total: number;
  pct: number;
}

// Aggregates every monolith's question counts (by category) against every
// farm's answered-correctly counts, joined on questionId — the "depth
// mastered" per horizon is a season-wide figure across all three farms, not
// any single one's.
function buildPitRows(monoliths: Monolith[], farms: FarmProgress[]): PitRow[] {
  const categoryByQuestionId = new Map<number, QuestionCategory>();
  const totals = new Map<QuestionCategory, number>();
  monoliths.forEach((monolith) => {
    monolith.questions.forEach((question) => {
      categoryByQuestionId.set(question.id, question.category);
      totals.set(question.category, (totals.get(question.category) ?? 0) + 1);
    });
  });

  const correctCounts = new Map<QuestionCategory, number>();
  farms.forEach((farm) => {
    farm.questions.forEach((progress) => {
      if (!progress.isCorrect) return;
      const category = categoryByQuestionId.get(progress.questionId);
      if (!category) return;
      correctCounts.set(category, (correctCounts.get(category) ?? 0) + 1);
    });
  });

  return PIT_LAYERS.map((layer) => {
    const total = totals.get(layer.category) ?? 0;
    const correct = correctCounts.get(layer.category) ?? 0;
    return {
      category: layer.category,
      label: categoryLabels[layer.category],
      depth: layer.depth,
      soilColor: layer.soilColor,
      correct,
      total,
      pct: total > 0 ? Math.round((correct / total) * 100) : 0
    };
  });
}

// The row furthest from mastered (lowest correct/total ratio, excluding
// anything with no questions yet) — used for the header's "thinnest layer"
// callout, same idea as the mockup's hand-authored blurb but computed from
// real progress instead of hard-coded.
function weakestPitRow(rows: PitRow[]): PitRow | null {
  const incomplete = rows.filter((row) => row.total > 0 && row.correct < row.total);
  if (incomplete.length === 0) return null;
  return [...incomplete].sort((a, b) => (a.correct / a.total) - (b.correct / b.total))[0];
}

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
}

function PitLayerRow({ row }: { row: PitRow; }) {
  const onFill = row.pct >= 22;
  const pctInk = row.pct >= 55 ? 'var(--mantine-color-moss-8)' : row.pct > 0 ? 'var(--mantine-color-terracotta-7)' : 'var(--mantine-color-charcoal-5)';

  return (
    <Group
      align="stretch"
      gap="md"
      wrap="nowrap"
    >
      <Text
        w={52}
        ta="right"
        pt={14}
        ff="monospace"
        fz={11}
        fw={700}
        c="charcoal.5"
        style={{ flex: 'none' }}
      >
        {row.depth}
      </Text>
      <Group
        align="center"
        gap="md"
        wrap="nowrap"
        p="md"
        style={{
          flex: 1, minWidth: 0, borderRadius: 'var(--mantine-radius-md)', background: onFill ? 'var(--mantine-color-charcoal-0)' : 'var(--mantine-color-body)'
        }}
      >
        <Box
          pos="relative"
          w={30}
          h={48}
          style={{
            flex: 'none', borderRadius: 10, overflow: 'hidden', background: 'var(--mantine-color-charcoal-1)'
          }}
        >
          <Box
            pos="absolute"
            left={0}
            right={0}
            bottom={0}
            h={`${Math.max(row.pct, 4)}%`}
            style={{
              background: row.soilColor,
              backgroundImage: 'repeating-linear-gradient(112deg, rgba(255,255,255,0.12) 0 2px, transparent 2px 11px)'
            }}
          />
        </Box>
        <Stack
          gap={4}
          style={{
            flex: 1, minWidth: 0 
          }}
        >
          <Group
            justify="space-between"
            align="baseline"
            gap="md"
          >
            <Text
              fz="sm"
              fw={800}
              c="charcoal.9"
            >
              {row.label}
            </Text>
            <Text
              fz={19}
              fw={800}
              c={pctInk}
              style={{
                flex: 'none', lineHeight: 1
              }}
            >
              {row.pct}
              %
            </Text>
          </Group>
          <Box
            h={9}
            style={{
              borderRadius: 999, background: 'var(--mantine-color-charcoal-1)', overflow: 'hidden'
            }}
          >
            <Box
              h="100%"
              w={`${row.pct}%`}
              style={{
                borderRadius: 999, background: row.soilColor 
              }}
            />
          </Box>
          <Text
            fz={12}
            fw={700}
            c="charcoal.6"
          >
            {row.correct}
            /
            {row.total}
            {' '}
            correct
          </Text>
        </Stack>
      </Group>
    </Group>
  );
}

interface StatTileDef {
  chip: string;
  value: string;
  label: string;
  note: string;
  tint: string;
  ink: string;
}

function StatTile({ stat }: { stat: StatTileDef; }) {
  return (
    <Paper
      radius="lg"
      p="lg"
      style={{
        background: stat.tint, boxShadow: 'var(--mantine-shadow-sm)'
      }}
    >
      <Box
        mb={14}
        style={{
          display: 'inline-block',
          padding: '4px 11px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.72)',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: stat.ink
        }}
      >
        {stat.chip}
      </Box>
      <Text
        fz={36}
        fw={800}
        c={stat.ink}
        style={{ lineHeight: 1 }}
      >
        {stat.value}
      </Text>
      <Text
        fz="sm"
        fw={700}
        c="charcoal.7"
        mt={8}
      >
        {stat.label}
      </Text>
      <Text
        fz={13}
        c="charcoal.6"
        mt={4}
      >
        {stat.note}
      </Text>
    </Paper>
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

function BackToFieldCard({
  monolithsLoading, monoliths, inProgressFarm, nextUnstartedFarm, allFinished
}: {
  monolithsLoading: boolean;
  monoliths: Monolith[];
  inProgressFarm: FarmProgress | undefined;
  nextUnstartedFarm: FarmProgress | undefined;
  allFinished: boolean;
}) {
  const navigate = useNavigate();

  const wrapperStyle = {
    background: 'var(--mantine-color-terracotta-6)', color: 'var(--mantine-color-terracotta-0)', position: 'relative' as const, overflow: 'hidden' as const
  };

  if (monolithsLoading) {
    return (
      <Paper
        radius="lg"
        p="xl"
        shadow="md"
        style={wrapperStyle}
      >
        <Loader color="white" />
      </Paper>
    );
  }

  const targetFarm = inProgressFarm ?? nextUnstartedFarm;
  const monolith = targetFarm ? monoliths.find((m) => m.orderIndex === targetFarm.orderIndex) : undefined;
  const stepIndex = targetFarm ? findResumeStepIndex(targetFarm, monolith) : 0;

  return (
    <Paper
      radius="lg"
      p="xl"
      shadow="md"
      style={wrapperStyle}
    >
      <Box
        pos="absolute"
        style={{
          right: -40, top: -40, width: 170, height: 170, borderRadius: 999, background: 'var(--mantine-color-terracotta-5)', opacity: 0.55
        }}
      />
      <Stack
        gap={6}
        pos="relative"
      >
        <Text
          fz={12}
          fw={800}
          tt="uppercase"
          style={{
            letterSpacing: '0.14em', opacity: 0.85
          }}
        >
          Back to the field
        </Text>
        {targetFarm ? (
          <>
            <Text
              fz={26}
              fw={800}
              style={{ lineHeight: 1.15 }}
            >
              {targetFarm.farmerName}
              {' · '}
              {targetFarm.name}
            </Text>
            <Text
              fz="sm"
              mb={14}
              style={{ lineHeight: 1.55 }}
            >
              {inProgressFarm
                ? `${targetFarm.scorePercent ?? 0}% harvested so far — pick up where you left off.`
                : 'A fresh soil problem is waiting for you.'}
            </Text>
            <Button
              radius="xl"
              color="terracotta"
              variant="white"
              w="fit-content"
              onClick={() => navigate(`/quests/${targetFarm.id}/${stepIndex}`)}
            >
              {inProgressFarm ? 'Resume Quest' : 'Start Quest'}
              {' →'}
            </Button>
          </>
        ) : (
          <Text
            fz="sm"
            style={{ lineHeight: 1.55 }}
          >
            {allFinished
              ? "Every farm is harvested — revisit any of them from the Quests page."
              : 'No quests available yet — check back soon.'}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}

function JourneyPanel({ farms, activeFarmId }: { farms: FarmProgress[]; activeFarmId: number | null; }) {
  const sortedFarms = useMemo(
    () => [...farms].sort((a, b) => a.orderIndex - b.orderIndex).slice(0, JOURNEY_PINS.length),
    [farms]
  );

  return (
    <Paper
      radius="lg"
      shadow="md"
      style={{
        padding: '26px 26px 0', overflow: 'hidden'
      }}
    >
      <Title
        order={2}
        fz={24}
        fw={800}
        c="charcoal.9"
        mb={4}
      >
        Your Journey
      </Title>
      <Text
        fz="sm"
        c="charcoal.6"
      >
        Three farms, three landscape positions.
      </Text>
      <Box
        pos="relative"
        h={190}
        mt="md"
        style={{ margin: '16px -26px 0' }}
      >
        <Box
          pos="absolute"
          style={{
            left: '-24%', right: '-24%', top: 54, height: 380, borderRadius: '50%', background: 'linear-gradient(155deg, var(--mantine-color-moss-2), var(--mantine-color-moss-4))'
          }}
        />
        {sortedFarms.map((farm, index) => {
          const pin = JOURNEY_PINS[index];
          const isActive = farm.id === activeFarmId;
          return (
            <Stack
              key={farm.id}
              gap={6}
              align="center"
              pos="absolute"
              style={{
                left: `${pin.xPct}%`,
                top: `${pin.yPct}%`,
                width: 76,
                marginLeft: -38,
                animation: isActive ? 'dashboard-pin-bob 3.8s ease-in-out infinite' : 'none'
              }}
            >
              <Avatar
                src={farmerImages[farm.orderIndex]}
                alt={farm.farmerName}
                size={isActive ? 58 : 48}
                radius="50%"
                style={{
                  border: isActive ? '4px solid var(--mantine-color-terracotta-6)' : '4px solid var(--mantine-color-body)',
                  boxShadow: isActive ? '0 8px 20px rgba(86, 66, 40, 0.24)' : 'var(--mantine-shadow-sm)'
                }}
                imageProps={{ style: {
                  objectFit: 'cover', objectPosition: '50% 15%'
                } }}
              />
              <Text
                fz={12}
                fw={800}
                c={isActive ? 'terracotta.7' : 'moss.8'}
                style={{
                  background: 'var(--mantine-color-body)', borderRadius: 999, padding: '3px 10px'
                }}
              >
                {farm.farmerName}
              </Text>
            </Stack>
          );
        })}
      </Box>
    </Paper>
  );
}

function mostRecentlyEarned(achievements: Achievement[]): Achievement | undefined {
  return [...achievements]
    .filter((achievement) => achievement.earned && achievement.earnedAt)
    .sort((a, b) => new Date(b.earnedAt!).getTime() - new Date(a.earnedAt!).getTime())[0];
}

function DashboardContent() {
  const { user, stats, farms, achievements } = useUser();
  const { monoliths, loading: monolithsLoading } = useMonoliths();
  const navigate = useNavigate();

  const allFarms = farms ?? [];
  const sortedFarms = useMemo(
    () => [...(farms ?? [])].sort((a, b) => a.orderIndex - b.orderIndex),
    [farms]
  );
  const completedFarms = allFarms.filter((farm) => farm.completed).length;
  const overallAccuracy = stats && stats.tasksCompleted > 0
    ? Math.round((stats.correctAnswers / stats.tasksCompleted) * 100)
    : null;

  const inProgressFarm = sortedFarms.find((farm) => hasAttempted(farm) && !hasFinished(farm));
  const nextUnstartedFarm = sortedFarms.find((farm) => !hasAttempted(farm));
  const allFinished = sortedFarms.length > 0 && sortedFarms.every(hasFinished);
  const activeFarmId = (inProgressFarm ?? nextUnstartedFarm)?.id ?? null;

  const earnedTrophies = achievements.filter((achievement) => achievement.earned);
  const mostRecentTrophy = mostRecentlyEarned(achievements);

  const pitRows = useMemo(() => buildPitRows(monoliths, farms ?? []), [monoliths, farms]);
  const weakLayer = weakestPitRow(pitRows);

  const greeting = `${timeOfDayGreeting()}, ${user?.firstName ?? 'farmer'}`;
  const subheading = weakLayer
    ? `Your soil profile is filling in one horizon at a time. ${weakLayer.label} is the thinnest layer so far.`
    : 'Your soil profile is filling in one horizon at a time — answer some questions to see it take shape.';

  const streak = stats?.currentStreak ?? 0;
  const weekStrip = WEEK_LABELS.map((label, index) => ({
    label, index, on: index >= 7 - Math.max(0, Math.min(7, streak))
  }));
  const reducedMotion = useReducedMotion(false, { getInitialValueInEffect: false });
  // Plays once per Dashboard mount (i.e. every time this page is opened —
  // React Router remounts it fresh on each navigation), as soon as real
  // stats are available. Deliberately not "did the streak just transition"
  // (useTransitionEffect's usual pattern): UserContext's stats are already
  // cached from an earlier page by the time Dashboard mounts more often
  // than not, so that transition (not-loaded -> loaded) would already be in
  // the past and never observed here — a plain mount-guarded effect fires
  // regardless of whether stats arrived before or after this component did.
  const [streakFlickering, setStreakFlickering] = useState(false);
  const hasPlayedStreakRef = useRef(false);
  useEffect(() => {
    if (hasPlayedStreakRef.current || !stats) return undefined;
    hasPlayedStreakRef.current = true;
    if (streak <= 0 || reducedMotion) return undefined;
    // Deliberately a one-shot "play this once stats are ready" effect, not a
    // transition/subscription — the ref guard above is what makes it safe
    // (it can only ever set true once per mount, never cascade).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStreakFlickering(true);
    const timer = setTimeout(() => setStreakFlickering(false), 500);
    return () => clearTimeout(timer);
  }, [stats, streak, reducedMotion]);

  const statTiles: StatTileDef[] = [
    {
      chip: 'Seasons',
      value: `${completedFarms}/${allFarms.length}`,
      label: 'Farms harvested',
      note: inProgressFarm
        ? `${inProgressFarm.name} in progress`
        : allFarms.length > 0 && completedFarms === allFarms.length
          ? 'All farms complete!'
          : 'Not started yet',
      tint: 'var(--mantine-color-moss-1)',
      ink: 'var(--mantine-color-moss-8)'
    },
    {
      chip: 'Aim',
      value: overallAccuracy !== null ? `${overallAccuracy}%` : '—',
      label: 'Overall accuracy',
      note: stats && stats.tasksCompleted > 0
        ? `${stats.correctAnswers} of ${stats.tasksCompleted} correct`
        : 'Not attempted yet',
      tint: 'var(--mantine-color-terracotta-0)',
      ink: 'var(--mantine-color-terracotta-7)'
    },
    {
      chip: 'Case',
      value: String(earnedTrophies.length),
      label: 'Trophies earned',
      note: mostRecentTrophy?.title ?? 'Keep going',
      tint: 'var(--mantine-color-mustard-1)',
      ink: 'var(--mantine-color-mustard-8)'
    },
    {
      chip: 'Streak',
      value: String(streak),
      label: 'Day streak',
      note: streak > 0 ? 'Keep it going' : 'Come back tomorrow',
      tint: 'var(--mantine-color-charcoal-0)',
      ink: 'var(--mantine-color-charcoal-7)'
    }
  ];

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
        maw={1180}
        mx="auto"
        gap={28}
        style={{ zIndex: 1 }}
      >
        <Group
          align="flex-end"
          justify="space-between"
          wrap="wrap"
          gap={28}
        >
          <Stack
            gap={10}
            style={{ maxWidth: 480 }}
          >
            <Text
              fz={13}
              fw={700}
              tt="uppercase"
              c="terracotta.7"
              style={{ letterSpacing: '0.14em' }}
            >
              Season One
              {' · '}
              {allFarms.length}
              {' '}
              Farms
            </Text>
            <Title
              order={1}
              fz={48}
              fw={800}
              c="charcoal.9"
              style={{ lineHeight: 1.05 }}
            >
              {greeting}
            </Title>
            <Text
              fz="md"
              c="charcoal.6"
              mt={6}
              style={{ lineHeight: 1.6 }}
            >
              {subheading}
            </Text>
          </Stack>

          <Paper
            radius="lg"
            shadow="sm"
            p="lg"
            style={{ minWidth: 240 }}
          >
            <Group
              gap={8}
              align="baseline"
              mb={14}
            >
              <Text
                fz={28}
                fw={800}
                c="terracotta.7"
                style={{
                  lineHeight: 1,
                  display: 'inline-block',
                  animation: streakFlickering && !reducedMotion ? 'quest-streak-flicker 500ms ease-out' : 'none'
                }}
              >
                {streak}
              </Text>
              <Text
                fz="sm"
                fw={700}
                c="charcoal.6"
              >
                day streak
                {' · '}
                keep it watered
              </Text>
            </Group>
            <Group gap={7}>
              {weekStrip.map((day, dayIndex) => (
                <Stack
                  key={day.index}
                  gap={6}
                  align="center"
                >
                  <Box
                    pos="relative"
                    w={22}
                    h={30}
                    style={{
                      borderRadius: '8px 8px 11px 11px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: day.on ? 'var(--mantine-color-moss-5)' : 'var(--mantine-color-charcoal-1)',
                      boxShadow: day.on ? 'inset 0 -6px 0 rgba(86, 99, 63, 0.22)' : 'none'
                    }}
                  >
                    {day.on && (
                      <Icon
                        name="Fire"
                        size={13}
                        weight="fill"
                        color="#fff8f1"
                        style={{
                          animation: streakFlickering && !reducedMotion
                            ? `quest-flame-pop 420ms ease-out ${dayIndex * 70}ms both`
                            : 'none'
                        }}
                      />
                    )}
                  </Box>
                  <Text
                    fz={11}
                    fw={700}
                    c="charcoal.5"
                  >
                    {day.label}
                  </Text>
                </Stack>
              ))}
            </Group>
          </Paper>
        </Group>

        {stats ? (
          <Box
            style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16
            }}
          >
            {statTiles.map((stat) => (
              <StatTile
                key={stat.label}
                stat={stat}
              />
            ))}
          </Box>
        ) : (
          <Loader color="terracotta" />
        )}

        <Group
          align="flex-start"
          gap={22}
          wrap="wrap"
        >
          <Paper
            radius="lg"
            shadow="md"
            p="xl"
            style={{
              flex: '1 1 560px', minWidth: 0
            }}
          >
            <Group
              justify="space-between"
              align="baseline"
              wrap="wrap"
              gap={14}
              mb={6}
            >
              <Title
                order={2}
                fz={27}
                fw={800}
                c="charcoal.9"
              >
                Your Profile Pit
              </Title>
              <Text
                fz={13}
                fw={700}
                c="charcoal.6"
              >
                Depth = what you&rsquo;ve mastered
              </Text>
            </Group>
            <Text
              fz="sm"
              c="charcoal.6"
              mb="lg"
            >
              Five horizons, dug top down. Each one fills as you answer its questions correctly.
            </Text>
            {monolithsLoading ? (
              <Loader color="terracotta" />
            ) : (
              <Stack gap={10}>
                {pitRows.map((row) => (
                  <PitLayerRow
                    key={row.category}
                    row={row}
                  />
                ))}
              </Stack>
            )}
          </Paper>

          <Stack
            gap={22}
            style={{
              flex: '1 1 360px', minWidth: 0
            }}
          >
            <BackToFieldCard
              monolithsLoading={monolithsLoading}
              monoliths={monoliths}
              inProgressFarm={inProgressFarm}
              nextUnstartedFarm={nextUnstartedFarm}
              allFinished={allFinished}
            />

            <JourneyPanel
              farms={allFarms}
              activeFarmId={activeFarmId}
            />

            <Paper
              radius="lg"
              shadow="md"
              p="xl"
            >
              <Group
                justify="space-between"
                align="baseline"
                mb="lg"
              >
                <Title
                  order={2}
                  fz={24}
                  fw={800}
                  c="charcoal.9"
                >
                  Trophy Case
                </Title>
                <Button
                  variant="subtle"
                  color="terracotta"
                  size="compact-sm"
                  onClick={() => navigate('/profile?tab=achievements')}
                >
                  View all
                </Button>
              </Group>
              <TrophyCase
                achievements={achievements}
                limit={TROPHY_PREVIEW_LIMIT}
              />
            </Paper>
          </Stack>
        </Group>
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
