import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Avatar, Box, Button, Group, Loader, Paper, Progress, SimpleGrid, Stack, Text, Title, UnstyledButton
} from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { Icon } from '@shared/ui/Icon';
import type { FarmProgress } from '@shared/api/models/farm.model';
import type { Monolith } from '@shared/api/models/monolith.model';
import { useUser } from '../context/UserContext';
import { useMonoliths } from '../hooks/useMonoliths';
import {
  buildQuestDays, questTargetUrl, type DayStatus, type PipStatus, type QuestDay, type QuestDayPart
} from '../lib/questDays';
import level1Pieter from '../assets/farmers/level-1-pieter.png';
import level2Nomsa from '../assets/farmers/level-2-nomsa.png';
import level3Willem from '../assets/farmers/level-3-willem.png';
import StaticMountainScene from '../components/StaticMountainScene';

// Keyed by orderIndex (levelNumber), matching the convention in FarmRoad.tsx
// and FarmerProgressGrid.tsx.
const farmerImages: Record<number, string> = {
  1: level1Pieter,
  2: level2Nomsa,
  3: level3Willem
};

function pipColor(status: PipStatus): string {
  if (status === 'correct') return 'var(--mantine-color-moss-6)';
  if (status === 'incorrect') return 'var(--mantine-color-terracotta-6)';
  return 'var(--mantine-color-charcoal-2)';
}

// Badge glyph: a check once a day is fully correct, the trophy for the
// Harvest day, otherwise the day's own position number — matching the
// mockup's floating circular badge exactly (number while ready/active,
// check once done).
function DayBadgeGlyph({ day, dayNumber }: { day: QuestDay; dayNumber: number; }) {
  if (day.status === 'done') {
    return (
      <Icon
        name="Check"
        size={18}
        weight="bold"
        color="white"
      />
    );
  }
  if (day.key === 'summary') {
    return (
      <Icon
        name="Trophy"
        size={16}
        weight="fill"
        color="white"
      />
    );
  }
  return (
    <Text
      fz="sm"
      fw={800}
      c="white"
    >
      {dayNumber}
    </Text>
  );
}

function dayStatusLabel(day: QuestDay): string {
  if (day.key === 'explore') return day.status === 'done' ? 'Studied' : 'Ready to study';
  if (day.key === 'summary') return day.status === 'done' ? 'Ready to claim' : 'Not yet available';
  const correct = day.parts.filter((part) => part.status === 'correct').length;
  const total = day.parts.length;
  if (day.status === 'done') return `${correct}/${total} correct`;
  if (day.status === 'active') return `In progress — ${correct}/${total}`;
  return 'Ready to work';
}

// Pastel card fill and badge fill both key off status, matching the
// mockup's done/active/ready colour map (a locked colour doesn't exist here
// — nothing is ever locked).
function dayColours(status: DayStatus): { cardBg: string; badgeBg: string; ink: string; } {
  if (status === 'done') {
    return {
      cardBg: 'var(--mantine-color-moss-1)', badgeBg: 'var(--mantine-color-moss-6)', ink: 'var(--mantine-color-moss-8)'
    };
  }
  if (status === 'active') {
    return {
      cardBg: 'var(--mantine-color-terracotta-0)', badgeBg: 'var(--mantine-color-terracotta-6)', ink: 'var(--mantine-color-terracotta-7)'
    };
  }
  return {
    cardBg: 'var(--mantine-color-body)', badgeBg: 'var(--mantine-color-terracotta-6)', ink: 'var(--mantine-color-terracotta-7)'
  };
}

function DayCard({ day, dayNumber, index, selected, onClick }: {
  day: QuestDay;
  dayNumber: number;
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  const { hovered, ref } = useHover<HTMLButtonElement>();
  const colours = dayColours(day.status);

  return (
    <UnstyledButton
      ref={ref}
      onClick={onClick}
      style={{
        flex: 'none', width: 218, marginTop: index % 2 === 1 ? 26 : 0
      }}
    >
      <Paper
        radius="lg"
        pos="relative"
        style={{
          padding: '26px 20px 20px',
          border: selected ? '2px solid var(--mantine-color-terracotta-6)' : '1px solid transparent',
          backgroundColor: colours.cardBg,
          boxShadow: selected ? 'var(--mantine-shadow-lg)' : 'var(--mantine-shadow-sm)',
          transform: hovered && !selected ? 'translateY(-3px)' : 'none',
          transition: 'transform 150ms ease, box-shadow 150ms ease'
        }}
      >
        <Box
          pos="absolute"
          top={-19}
          left={20}
          w={38}
          h={38}
          style={{
            borderRadius: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: colours.badgeBg,
            boxShadow: 'var(--mantine-shadow-sm)'
          }}
        >
          <DayBadgeGlyph
            day={day}
            dayNumber={dayNumber}
          />
        </Box>

        <Text
          fz="xs"
          fw={800}
          tt="uppercase"
          c={colours.ink}
          mb={6}
          style={{ letterSpacing: '0.08em' }}
        >
          {day.key === 'summary' ? 'Harvest' : `Day ${dayNumber}`}
        </Text>
        <Text
          fz={19}
          fw={700}
          c="charcoal.9"
          mb={10}
          style={{ lineHeight: 1.15 }}
        >
          {day.title}
        </Text>
        {day.parts.length > 0 && (
          <Group
            gap={5}
            mb={12}
          >
            {day.parts.map((part) => (
              <Box
                key={part.questionId}
                w={18}
                h={9}
                style={{
                  borderRadius: 999, background: pipColor(part.status)
                }}
              />
            ))}
          </Group>
        )}
        <Text
          fz={13}
          fw={700}
          c={colours.ink}
        >
          {dayStatusLabel(day)}
        </Text>
      </Paper>
    </UnstyledButton>
  );
}

function partActionLabel(status: PipStatus): string {
  if (status === 'correct') return 'Review';
  if (status === 'incorrect') return 'Retry';
  return 'Answer';
}

function partNoteLabel(status: PipStatus): string {
  if (status === 'correct') return 'Correct';
  if (status === 'incorrect') return 'Missed';
  return 'Not attempted';
}

function partRowBackground(status: PipStatus): string {
  if (status === 'correct') return 'var(--mantine-color-moss-0)';
  if (status === 'incorrect') return 'var(--mantine-color-terracotta-0)';
  return 'var(--mantine-color-charcoal-0)';
}

// One row per question in the day — mirrors the day's own pips but lets the
// student jump straight to (or review) any single part, not just the day as
// a whole.
function PartRow({ dayTitle, part, index, farmId }: {
  dayTitle: string;
  part: QuestDayPart;
  index: number;
  farmId: number;
}) {
  const navigate = useNavigate();

  return (
    <Group
      justify="space-between"
      wrap="nowrap"
      gap="md"
      p="md"
      style={{
        borderRadius: 'var(--mantine-radius-md)', background: partRowBackground(part.status)
      }}
    >
      <Group
        gap="md"
        wrap="nowrap"
        style={{
          flex: 1, minWidth: 0
        }}
      >
        <Box
          w={22}
          h={22}
          style={{
            borderRadius: 999,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: pipColor(part.status)
          }}
        >
          {part.status === 'correct' && (
            <Icon
              name="Check"
              size={12}
              weight="bold"
              color="white"
            />
          )}
          {part.status === 'incorrect' && (
            <Icon
              name="X"
              size={12}
              weight="bold"
              color="white"
            />
          )}
        </Box>
        <Text
          fz="sm"
          fw={600}
          c="charcoal.8"
          truncate
        >
          {dayTitle} &mdash; part {index + 1}
        </Text>
      </Group>
      <Group
        gap="md"
        wrap="nowrap"
      >
        <Text
          fz="xs"
          fw={700}
          c="charcoal.6"
        >
          {partNoteLabel(part.status)}
        </Text>
        <Button
          onClick={() => navigate(questTargetUrl(farmId, part.target))}
          variant="light"
          color={part.status === 'incorrect' ? 'terracotta' : 'charcoal'}
          radius="xl"
          size="xs"
        >
          {partActionLabel(part.status)}
        </Button>
      </Group>
    </Group>
  );
}

function DayDetailPanel({ day, dayNumber, farmId }: { day: QuestDay; dayNumber: number; farmId: number; }) {
  const navigate = useNavigate();

  function ctaLabel(): string {
    if (!day.target) return 'Not Yet Available';
    if (day.key === 'explore') return 'Study the Profile';
    if (day.key === 'summary') return 'View Harvest Score';
    if (day.target.mode === 'review') return 'Review Answers';
    return day.status === 'active' ? 'Resume Day' : 'Start Day';
  }

  return (
    <Paper
      radius="lg"
      p="xl"
      shadow="md"
      mt={10}
    >
      <Group
        justify="space-between"
        align="flex-start"
        wrap="wrap"
        gap="md"
      >
        <Stack
          gap={6}
          style={{
            flex: 1, minWidth: 240
          }}
        >
          <Text
            fz="xs"
            fw={800}
            tt="uppercase"
            c="terracotta.7"
            style={{ letterSpacing: '0.1em' }}
          >
            {day.key === 'summary' ? 'Harvest' : `Day ${dayNumber}`}
          </Text>
          <Title
            order={3}
            c="charcoal.9"
            fz={27}
            fw={800}
          >
            {day.title}
          </Title>
          <Text
            fz="sm"
            c="charcoal.6"
            maw={480}
          >
            {day.blurb}
          </Text>
        </Stack>
        <Button
          color="terracotta"
          radius="xl"
          size="md"
          disabled={!day.target}
          onClick={() => day.target && navigate(questTargetUrl(farmId, day.target))}
        >
          {ctaLabel()}
        </Button>
      </Group>

      {day.parts.length > 0 && (
        <Stack
          gap={8}
          mt="lg"
        >
          {day.parts.map((part, index) => (
            <PartRow
              key={part.questionId}
              dayTitle={day.title}
              part={part}
              index={index}
              farmId={farmId}
            />
          ))}
        </Stack>
      )}
    </Paper>
  );
}

function FarmOverview({ farm, monolith, onBack }: {
  farm: FarmProgress;
  monolith: Monolith;
  onBack: () => void;
}) {
  const days = useMemo(() => buildQuestDays(monolith, farm), [monolith, farm]);
  const [selectedDayKey, setSelectedDayKey] = useState<string>(
    () => days.find((day) => day.status === 'ready' || day.status === 'active')?.key ?? days[0].key
  );
  const selectedDayIndex = Math.max(0, days.findIndex((day) => day.key === selectedDayKey));
  const selectedDay = days[selectedDayIndex] ?? days[0];
  const pct = farm.scorePercent ?? 0;

  return (
    <Stack gap={26}>
      <UnstyledButton onClick={onBack}>
        <Paper
          radius="xl"
          shadow="sm"
          px={20}
          py={10}
          style={{ display: 'inline-block' }}
        >
          <Group gap={6}>
            <Icon
              name="ArrowLeft"
              size={16}
              color="var(--mantine-color-charcoal-6)"
            />
            <Text
              fz="sm"
              fw={700}
              c="charcoal.6"
            >
              All Farms
            </Text>
          </Group>
        </Paper>
      </UnstyledButton>

      <Group
        align="flex-start"
        gap={26}
        wrap="wrap"
      >
        <Paper
          radius="lg"
          p="xl"
          shadow="md"
          style={{
            width: 300, flex: 'none'
          }}
        >
          <Stack gap="lg">
            <Group
              gap="md"
              wrap="nowrap"
            >
              <Avatar
                src={farmerImages[farm.orderIndex]}
                alt={farm.farmerName}
                size={66}
                radius="50%"
                imageProps={{ style: {
                  objectFit: 'cover', objectPosition: '50% 15%'
                } }}
              />
              <Stack
                gap={0}
                style={{ minWidth: 0 }}
              >
                <Text
                  fw={700}
                  fz="lg"
                  c="charcoal.9"
                >
                  {farm.farmerName}
                </Text>
                <Text
                  fz="sm"
                  c="charcoal.6"
                >
                  {farm.name}
                </Text>
              </Stack>
            </Group>

            <Paper
              radius="md"
              p="md"
              bg="moss.0"
            >
              <Text
                fz="xs"
                fw={800}
                tt="uppercase"
                c="moss.8"
                mb={6}
                style={{ letterSpacing: '0.08em' }}
              >
                The Farmer&rsquo;s Problem
              </Text>
              <Text
                fz="sm"
                fs="italic"
                c="charcoal.8"
              >
                &ldquo;{farm.scenario}&rdquo;
              </Text>
            </Paper>

            <Stack gap={6}>
              <Group justify="space-between">
                <Text
                  fz="xs"
                  fw={700}
                  c="charcoal.6"
                >
                  Harvest score
                </Text>
                <Text
                  fz="sm"
                  fw={800}
                  c="terracotta.7"
                >
                  {pct}%
                </Text>
              </Group>
              <Progress
                value={pct}
                color={pct >= 75 ? 'moss' : 'terracotta'}
                size="md"
                radius="xl"
              />
            </Stack>
          </Stack>
        </Paper>

        <Stack
          style={{
            flex: 1, minWidth: 300
          }}
          gap="md"
        >
          <Stack gap={4}>
            <Group
              gap={12}
              align="baseline"
            >
              <Title
                order={2}
                c="charcoal.9"
                fz={40}
                fw={800}
                style={{ lineHeight: 1.05 }}
              >
                The Season
              </Title>
              <Text
                fz="sm"
                fw={700}
                c="charcoal.6"
              >
                {days.length - 1}
                {' '}
                days + harvest
              </Text>
            </Group>
            <Text
              fz="sm"
              c="charcoal.6"
            >
              Study, answer, and review each day in any order.
            </Text>
          </Stack>

          <Box
            pos="relative"
            style={{
              overflowX: 'auto', paddingTop: 30, paddingBottom: 12
            }}
          >
            <Box
              pos="absolute"
              left={0}
              right={0}
              top={48}
              h={2}
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, var(--mantine-color-charcoal-3) 0 12px, transparent 12px 22px)',
                opacity: 0.6
              }}
            />
            <Group
              gap="md"
              wrap="nowrap"
              align="flex-start"
              pos="relative"
            >
              {days.map((day, index) => (
                <DayCard
                  key={day.key}
                  day={day}
                  dayNumber={index + 1}
                  index={index}
                  selected={day.key === selectedDayKey}
                  onClick={() => setSelectedDayKey(day.key)}
                />
              ))}
            </Group>
          </Box>

          <DayDetailPanel
            day={selectedDay}
            dayNumber={selectedDayIndex + 1}
            farmId={farm.id}
          />
        </Stack>
      </Group>
    </Stack>
  );
}

function FarmCard({ farm, onSelect }: { farm: FarmProgress; onSelect: () => void; }) {
  const { hovered, ref } = useHover<HTMLButtonElement>();
  const pct = farm.scorePercent ?? 0;

  return (
    <UnstyledButton
      ref={ref}
      onClick={onSelect}
      style={{
        width: '100%', height: '100%'
      }}
    >
      <Paper
        radius="lg"
        p="xl"
        h="100%"
        style={{
          border: pct > 0 ? '3px solid var(--mantine-color-terracotta-4)' : '3px solid transparent',
          boxShadow: hovered ? 'var(--mantine-shadow-lg)' : 'var(--mantine-shadow-md)',
          transform: hovered ? 'translateY(-4px)' : 'none',
          transition: 'transform 150ms ease, box-shadow 150ms ease'
        }}
      >
        <Stack
          gap="lg"
          h="100%"
        >
          <Group
            gap="md"
            wrap="nowrap"
          >
            <Avatar
              src={farmerImages[farm.orderIndex]}
              alt={farm.farmerName}
              size={62}
              radius="50%"
              imageProps={{ style: {
                objectFit: 'cover', objectPosition: '50% 15%'
              } }}
            />
            <Stack
              gap={0}
              style={{ minWidth: 0 }}
            >
              <Text
                fw={700}
                fz={21}
                c="charcoal.9"
                truncate
                style={{ lineHeight: 1.15 }}
              >
                {farm.farmerName}
              </Text>
              <Text
                fz="sm"
                fw={600}
                c="charcoal.6"
                truncate
              >
                {farm.name}
              </Text>
            </Stack>
          </Group>

          <Text
            fz="sm"
            fs="italic"
            c="charcoal.8"
            style={{
              flex: 1, lineHeight: 1.55
            }}
          >
            &ldquo;{farm.scenario}&rdquo;
          </Text>

          <Stack gap={6}>
            <Group justify="space-between">
              <Text
                fz="xs"
                fw={700}
                c="charcoal.6"
              >
                Harvest progress
              </Text>
              <Text
                fz="xs"
                fw={800}
                c={pct >= 75 ? 'moss.7' : 'terracotta.7'}
              >
                {pct}%
              </Text>
            </Group>
            <Progress
              value={pct}
              color={pct >= 75 ? 'moss' : 'terracotta'}
              size="md"
              radius="xl"
            />
          </Stack>

          <Text
            fz="sm"
            fw={700}
            c="terracotta.7"
          >
            {pct > 0 ? 'Continue the season →' : 'Start the season →'}
          </Text>
        </Stack>
      </Paper>
    </UnstyledButton>
  );
}

function Quests() {
  const { farms, loading: userLoading } = useUser();
  const { monoliths, loading: monolithsLoading } = useMonoliths();
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);

  const sortedFarms = useMemo(
    () => [...(farms ?? [])].sort((a, b) => a.orderIndex - b.orderIndex),
    [farms]
  );

  const loading = userLoading || monolithsLoading;
  const selectedFarm = sortedFarms.find((farm) => farm.id === selectedFarmId);
  // Levels and monoliths are seeded 1:1 by orderIndex/levelNumber (see
  // prisma/seed.ts) — FarmProgress carries no monolith id, so this is the
  // only join available on the client.
  const selectedMonolith = selectedFarm
    ? monoliths.find((monolith) => monolith.orderIndex === selectedFarm.orderIndex)
    : undefined;

  const seasonPercent = sortedFarms.length > 0
    ? Math.round(sortedFarms.reduce((sum, farm) => sum + (farm.scorePercent ?? 0), 0) / sortedFarms.length)
    : 0;

  return (
    <Box
      px="xl"
      pt={140}
      pb={80}
      maw={1240}
      mx="auto"
      pos="relative"
      style={{ overflow: 'hidden' }}
    >
      <StaticMountainScene />
      <Box
        pos="absolute"
        top="6%"
        right="7%"
        w={96}
        h={96}
        style={{
          borderRadius: 999, background: 'var(--mantine-color-terracotta-2)', opacity: 0.6
        }}
      />
      <Box pos="relative">
        {loading && <Loader color="terracotta" />}

        {!loading && !selectedFarm && (
          <Stack gap={40}>
            <Group
              justify="space-between"
              align="flex-end"
              wrap="wrap"
              gap="lg"
            >
              <Stack gap={10}>
                <Text
                  fz={13}
                  fw={700}
                  tt="uppercase"
                  c="terracotta.7"
                  style={{ letterSpacing: '0.14em' }}
                >
                  Season One &middot; {sortedFarms.length} Farms
                </Text>
                <Title
                  order={1}
                  c="charcoal.9"
                  fz={52}
                  fw={800}
                  style={{ lineHeight: 1.03 }}
                >
                  Pick a Farm to Work Today
                </Title>
                <Text
                  fz="md"
                  c="charcoal.6"
                  maw={520}
                  mt={6}
                  style={{ lineHeight: 1.6 }}
                >
                  Each farmer has a soil problem waiting. Walk their season day by day — study the
                  profile, name the horizons, then call the form.
                </Text>
              </Stack>
              <Paper
                radius="lg"
                shadow="sm"
                p="lg"
                style={{ minWidth: 210 }}
              >
                <Text
                  fz="sm"
                  fw={700}
                  c="charcoal.6"
                  mb={6}
                >
                  Season Harvest
                </Text>
                <Text
                  fz={34}
                  fw={800}
                  c="terracotta.7"
                  style={{ lineHeight: 1 }}
                >
                  {seasonPercent}%
                </Text>
                <Progress
                  value={seasonPercent}
                  color="terracotta"
                  size="sm"
                  radius="xl"
                  mt={12}
                />
              </Paper>
            </Group>

            <SimpleGrid
              cols={{
                base: 1, sm: 2, lg: 3
              }}
              spacing="lg"
            >
              {sortedFarms.map((farm) => (
                <FarmCard
                  key={farm.id}
                  farm={farm}
                  onSelect={() => setSelectedFarmId(farm.id)}
                />
              ))}
            </SimpleGrid>
          </Stack>
        )}

        {!loading && selectedFarm && !selectedMonolith && (
          <Stack gap="lg">
            <UnstyledButton onClick={() => setSelectedFarmId(null)}>
              <Paper
                radius="xl"
                shadow="sm"
                px={20}
                py={10}
                style={{ display: 'inline-block' }}
              >
                <Group gap={6}>
                  <Icon
                    name="ArrowLeft"
                    size={16}
                    color="var(--mantine-color-charcoal-6)"
                  />
                  <Text
                    fz="sm"
                    fw={700}
                    c="charcoal.6"
                  >
                    All Farms
                  </Text>
                </Group>
              </Paper>
            </UnstyledButton>
            <Text
              c="charcoal.5"
              fz="sm"
            >
              Content for this quest is coming soon.
            </Text>
          </Stack>
        )}

        {!loading && selectedFarm && selectedMonolith && (
          <FarmOverview
            farm={selectedFarm}
            monolith={selectedMonolith}
            onBack={() => setSelectedFarmId(null)}
          />
        )}
      </Box>
    </Box>
  );
}

export default Quests;
