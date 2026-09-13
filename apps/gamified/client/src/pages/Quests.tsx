import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Avatar, Box, Button, Group, Loader, Paper, Progress, SimpleGrid, Stack, Text, Title, UnstyledButton
} from '@mantine/core';
import { useHover, useReducedMotion } from '@mantine/hooks';
import { Icon } from '@shared/ui/Icon';
import type { FarmProgress } from '@shared/api/models/farm.model';
import type { Monolith } from '@shared/api/models/monolith.model';
import { useUser } from '../context/UserContext';
import { useMonoliths } from '../hooks/useMonoliths';
import { useCountUp } from '../hooks/useCountUp';
import { useTransitionEffect } from '../hooks/useTransitionEffect';
import {
  buildQuestDays, questTargetUrl, type DayStatus, type PipStatus, type QuestDay, type QuestDayPart, type QuestTarget
} from '../lib/questDays';
import level1Pieter from '../assets/farmers/level-1-pieter.png';
import level2Nomsa from '../assets/farmers/level-2-nomsa.png';
import level3Willem from '../assets/farmers/level-3-willem.png';
import QuestScene from '../components/QuestScene';
import {
  FARM_STATIONS, NEUTRAL_CAMERA, type CameraTarget, type FarmFlagState
} from '../lib/questScene';
import { PAGE_FADE_MS as CONTENT_FADE_MS } from '../lib/pageTransition';

// How far the camera pushes in on a selected farm's station — 1 is neutral.
const SELECTED_ZOOM = 1.8;

// Keyed by orderIndex (levelNumber), matching the convention in FarmRoad.tsx
// and FarmerProgressGrid.tsx.
const farmerImages: Record<number, string> = {
  1: level1Pieter,
  2: level2Nomsa,
  3: level3Willem
};

// How far apart each pip's fill fires when several resolve in the same
// render — small enough that it still reads as "together", not a slow
// chase across the row.
const PIP_STAGGER_MS = 90;

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

// One pip's own fill transition — detects going from unattempted to a
// resolved state while mounted (never on first render) and layers a brief
// scale-pop on top of the background-color transition already set inline.
// `index` staggers that pop's start when several pips resolve in the same
// render, via transitionDelay/animationDelay rather than a JS timer chain.
function DayPip({ status, index, reducedMotion }: { status: PipStatus; index: number; reducedMotion: boolean; }) {
  const justResolved = useTransitionEffect(
    status,
    (previous, next) => previous === 'unattempted' && next !== 'unattempted',
    420 + index * PIP_STAGGER_MS
  );
  const delay = `${index * PIP_STAGGER_MS}ms`;

  return (
    <Box
      w={18}
      h={9}
      style={{
        borderRadius: 999,
        background: pipColor(status),
        transition: 'background 260ms ease',
        transitionDelay: delay,
        animation: justResolved && !reducedMotion ? `quest-pip-fill 420ms ease-out ${delay}` : 'none'
      }}
    />
  );
}

function DayCard({ day, dayNumber, index, selected, onClick }: {
  day: QuestDay;
  dayNumber: number;
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  const { hovered, ref } = useHover<HTMLButtonElement>();
  const reducedMotion = useReducedMotion(false, { getInitialValueInEffect: false });
  const colours = dayColours(day.status);
  // Only the active-to-done edge glows — matches the ticket's own scope
  // (don't animate ready->active or invent a transition for the two
  // synthetic days, which never carry this status pair at all).
  const justCompleted = useTransitionEffect(
    day.status,
    (previous, next) => previous === 'active' && next === 'done',
    700
  );

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
          transition: 'transform 150ms ease, box-shadow 150ms ease',
          animation: justCompleted && !reducedMotion ? 'quest-day-glow 700ms ease-out' : 'none'
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
            {day.parts.map((part, partIndex) => (
              <DayPip
                key={part.questionId}
                status={part.status}
                index={partIndex}
                reducedMotion={reducedMotion}
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

// DayDetailPanel's own CTA — one label per day type/state, including
// "Review Answers", which is deliberately a per-day/per-part action (it
// also appears on PartRow below) and never shows up on the season-level
// button below.
function dayCtaLabel(day: QuestDay): string {
  if (!day.target) return 'Not Yet Available';
  if (day.key === 'explore') return 'Study the Profile';
  if (day.key === 'summary') return 'View Harvest Score';
  if (day.target.mode === 'review') return 'Review Answers';
  return day.status === 'active' ? 'Resume Day' : 'Start Day';
}

// FarmOverview's header shortcut button — deliberately only ever one of
// these three words, regardless of which day is selected or its type
// (explore/category/summary). "Review Answers" lives on DayDetailPanel and
// PartRow only; this button's job is just "get me back into the quest".
function seasonCtaLabel(day: QuestDay): string {
  if (day.status === 'done') return 'Retry Quest';
  if (day.status === 'active') return 'Resume Quest';
  return 'Start Quest';
}

// A finished day's own `target` points at its review link (that's what
// DayDetailPanel's "Review Answers" button uses), and an active-but-fully-
// attempted day (every question answered, some wrong) also carries a
// review-mode target for the same reason — buildQuestDays only distinguishes
// "not everything's been attempted yet" from "it has", not "and was it all
// correct". Neither belongs on this button: "Retry Quest" must replay from
// the top, and "Resume Quest" must land on the first still-wrong question in
// play mode, not silently open a review screen.
function seasonCtaTarget(day: QuestDay): QuestTarget | null {
  if (!day.target) return null;
  // The synthetic "explore" day's own target always carries `phase:
  // 'explore'`, which QuestRunner treats as a read-only profile visit (its
  // `linkedToProfile` check) and ends with "Back to Quests" instead of
  // "Continue" — correct for that day's own "Study the Profile" button, but
  // this header button's whole job is to start/resume/retry the actual
  // quest, so it must go in through the normal intro walkthrough instead
  // (same stepIndex, no phase param).
  if (day.key === 'explore') {
    return {
      stepIndex: 0, mode: 'play'
    };
  }
  if (day.status === 'done') {
    return {
      ...day.target, mode: 'play'
    };
  }
  if (day.status === 'active' && day.target.mode === 'review') {
    const firstIncorrect = day.parts.find((part) => part.status === 'incorrect');
    const target = firstIncorrect?.target ?? day.target;
    return {
      ...target, mode: 'play'
    };
  }
  return day.target;
}

function DayDetailPanel({ day, dayNumber, farmId }: { day: QuestDay; dayNumber: number; farmId: number; }) {
  const navigate = useNavigate();

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
          {dayCtaLabel(day)}
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
  const navigate = useNavigate();
  const days = useMemo(() => buildQuestDays(monolith, farm), [monolith, farm]);
  const [selectedDayKey, setSelectedDayKey] = useState<string>(
    () => days.find((day) => day.status === 'ready' || day.status === 'active')?.key ?? days[0].key
  );
  const selectedDayIndex = Math.max(0, days.findIndex((day) => day.key === selectedDayKey));
  const selectedDay = days[selectedDayIndex] ?? days[0];
  const pct = farm.scorePercent ?? 0;
  const animatedPct = useCountUp(pct);

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
                  {animatedPct}%
                </Text>
              </Group>
              <Progress
                value={animatedPct}
                color={pct >= 75 ? 'moss' : 'terracotta'}
                size="md"
                radius="xl"
                transitionDuration={0}
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
          <Group
            justify="space-between"
            align="flex-start"
            wrap="wrap"
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
            <Button
              color="terracotta"
              radius="xl"
              size="md"
              disabled={!seasonCtaTarget(selectedDay)}
              onClick={() => {
                const target = seasonCtaTarget(selectedDay);
                if (target) navigate(questTargetUrl(farm.id, target));
              }}
            >
              {seasonCtaLabel(selectedDay)}
            </Button>
          </Group>

          <Box
            className="quest-day-scroll"
            style={{
              overflowX: 'auto', paddingTop: 30, paddingBottom: 16
            }}
          >
            <Group
              gap="md"
              wrap="nowrap"
              align="flex-start"
              style={{ width: 'max-content' }}
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
  const animatedPct = useCountUp(pct);

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
                {animatedPct}%
              </Text>
            </Group>
            <Progress
              value={animatedPct}
              color={pct >= 75 ? 'moss' : 'terracotta'}
              size="md"
              radius="xl"
              transitionDuration={0}
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

  // Two separate pieces of selection state, deliberately not one: `activeFarmId`
  // drives the camera + flags and updates the instant a farm is (de)selected;
  // `selectedFarmId` drives which content renders and only updates once the
  // brief fade-out has finished. That's what makes the camera start panning
  // immediately while the foreground content swap trails slightly behind it
  // on its own, shorter timer — not two parallel selection state machines,
  // just one action (`selectFarm`) fanning out to both.
  const [activeFarmId, setActiveFarmId] = useState<number | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [contentVisible, setContentVisible] = useState(true);

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
  const animatedSeasonPercent = useCountUp(seasonPercent);

  // Same station index convention as FarmRoad's pins: i-th farm once sorted
  // by orderIndex maps to FARM_STATIONS[i].
  const activeStationIndex = activeFarmId != null
    ? sortedFarms.findIndex((farm) => farm.id === activeFarmId)
    : -1;
  const station = activeStationIndex >= 0 ? FARM_STATIONS[activeStationIndex] : null;
  const cameraTarget: CameraTarget = station
    ? {
      xPct: station.xPct, yPct: station.yPct, zoom: SELECTED_ZOOM
    }
    : NEUTRAL_CAMERA;
  const flagStates: FarmFlagState[] = FARM_STATIONS.map((_, index) => {
    if (activeStationIndex === -1) return 'none-selected';
    return index === activeStationIndex ? 'selected' : 'other-selected';
  });
  const farmAvatars = sortedFarms.map((farm) => ({
    src: farmerImages[farm.orderIndex], alt: farm.farmerName
  }));

  // The single action driving both the camera/flags (instant) and the
  // content swap (fades out, swaps, fades back in) — reused for both
  // selecting a farm and going back to the list (farmId: null resets the
  // camera to NEUTRAL_CAMERA the same way).
  function selectFarm(farmId: number | null) {
    setActiveFarmId(farmId);
    setContentVisible(false);
    window.setTimeout(() => {
      setSelectedFarmId(farmId);
      setContentVisible(true);
    }, CONTENT_FADE_MS);
  }

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
      <QuestScene
        cameraTarget={cameraTarget}
        flagStates={flagStates}
        farmAvatars={farmAvatars}
      />
      <Box
        pos="relative"
        style={{
          opacity: contentVisible ? 1 : 0, transition: `opacity ${CONTENT_FADE_MS}ms ease`
        }}
      >
        {loading && (
          <Group
            justify="center"
            mih="60vh"
          >
            <Loader color="terracotta" />
          </Group>
        )}

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
                  {animatedSeasonPercent}%
                </Text>
                <Progress
                  value={animatedSeasonPercent}
                  color="terracotta"
                  size="sm"
                  radius="xl"
                  mt={12}
                  transitionDuration={0}
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
                  onSelect={() => selectFarm(farm.id)}
                />
              ))}
            </SimpleGrid>
          </Stack>
        )}

        {!loading && selectedFarm && !selectedMonolith && (
          <Stack gap="lg">
            <UnstyledButton onClick={() => selectFarm(null)}>
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
            onBack={() => selectFarm(null)}
          />
        )}
      </Box>
    </Box>
  );
}

export default Quests;
