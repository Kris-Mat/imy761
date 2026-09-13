import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import {
  Avatar, Box, Button, Card, Flex, Group, Image, Loader, Modal, Paper, Progress, Radio, Stack, Text, Title, UnstyledButton
} from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import confetti from 'canvas-confetti';
import type { Achievement } from '@shared/api/models/achievement.model';
import type { FarmProgress } from '@shared/api/models/farm.model';
import type { Horizon, Monolith, Question } from '@shared/api/models/monolith.model';
import { authApi } from '@shared/api/services/auth.api';
import { userApi } from '@shared/api/services/users.api';
import { Icon } from '@shared/ui/Icon';
import { useUser } from '../context/UserContext';
import { useMonoliths } from '../hooks/useMonoliths';
import { categoryLabels } from '../lib/questionCategory';
import { hasAttempted, hasFinished } from '../lib/questProgress';
import MunsellChip from '../components/MunsellChip';
import { useAnswerFeedback } from '../hooks/useAnswerFeedback';
import { useTransitionEffect } from '../hooks/useTransitionEffect';
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

type Phase = 'intro' | 'explore' | 'question';

// 'play' records new attempts and never shows what was answered previously —
// every run through a quest, first or retry, is a clean slate. 'review' is
// read-only: it replays the stored answers with their right/wrong marking and
// submits nothing.
type Mode = 'play' | 'review';

// Mirrors AttemptService's PASSING_SCORE_PERCENT on the server. Nothing is
// gated on it — every quest is playable in any order — it only colours the
// harvest bar and picks which message the farmer gives at the end.
const PASSING_SCORE_PERCENT = 75;

// Fires immediately off the attempt response, not deferred to quest
// completion — achievements like FIRST_ATTEMPT can unlock mid-quest, on any
// question. A single combined toast when more than one unlocks at once
// avoids stacking near-identical toasts for one submit.
function showAchievementUnlockToast(newlyUnlockedAchievements: Achievement[]) {
  if (newlyUnlockedAchievements.length === 0) return;

  const icon = (
    <Icon
      name="Trophy"
      weight="fill"
    />
  );

  if (newlyUnlockedAchievements.length === 1) {
    const [achievement] = newlyUnlockedAchievements;
    notifications.show({
      title: `Achievement unlocked: ${achievement.title}`,
      message: achievement.description,
      color: 'mustard',
      icon,
      autoClose: 6000
    });
    return;
  }

  notifications.show({
    title: `${newlyUnlockedAchievements.length} achievements unlocked!`,
    message: newlyUnlockedAchievements.map((achievement) => achievement.title).join(', '),
    color: 'mustard',
    icon,
    autoClose: 6000
  });
}

// How long the anticipation beat plays before the existing toast fires —
// long enough to read as "something's about to happen", short enough not to
// delay the actual reveal into feeling sluggish.
const ACHIEVEMENT_ANTICIPATION_MS = 340;

// The brief "something's about to happen" beat shown just before the
// achievement toast fires, in the same top-right corner the toast is about
// to land in (see root.tsx's <Notifications position="top-right" />) — a
// small trophy badge brightening in place, same gold as TrophyCase's earned
// styling, that fades out right as the real toast takes over. Portaled to
// document.body for the same reason StaticMountainScene is: escaping the
// ScrollSmoother-transformed ancestor that would otherwise break
// position:fixed.
function AchievementGlowBeat() {
  return createPortal(
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        // Mantine's Notifications container defaults to the "overlay" level
        // (z-index 400) — this needs to sit clearly above it, not tie with
        // it, so the beat is never left stacked under the toast that lands
        // in the same corner moments later.
        zIndex: 450,
        width: 44,
        height: 44,
        borderRadius: 999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#e0b457',
        animation: `quest-achievement-glow ${ACHIEVEMENT_ANTICIPATION_MS}ms ease-out`
      }}
    >
      <Icon
        name="Trophy"
        weight="fill"
        size={20}
        color="#fff8f1"
      />
    </div>,
    document.body
  );
}

function FarmerPortrait({ farmerName, farmOrderIndex }: { farmerName: string; farmOrderIndex: number; }) {
  return (
    <Stack
      gap={6}
      align="center"
      w={110}
    >
      <Avatar
        src={farmerImages[farmOrderIndex]}
        alt={farmerName}
        size={90}
        radius="50%"
        style={{ border: '3px solid var(--mantine-color-moss-6)' }}
        imageProps={{ style: {
          objectFit: 'cover', objectPosition: '50% 15%'
        } }}
      />
      <Text
        fz="sm"
        fw={600}
        c="charcoal.8"
        ta="center"
      >
        {farmerName}
      </Text>
    </Stack>
  );
}

// Horizons are drawn as equal-height slices over the monolith image, top to
// bottom in the order they're listed. Shared by the explore step (click to
// select) and the in-question reference (hover to peek).
function horizonBand(index: number, count: number) {
  const height = 100 / count;
  return {
    top: `${height * index}%`, h: `${height}%`
  };
}

function HorizonDetails({ horizon, revealLabel = true, revealCharacteristics = true }: {
  horizon: Horizon;
  revealLabel?: boolean;
  revealCharacteristics?: boolean;
}) {
  // A gated horizon's characteristics aren't rendered at all (the `&&` above
  // short-circuits), so the stagger below can't leak anything through timing
  // — there's simply nothing here to reveal until revealCharacteristics
  // flips true on a later render.
  // Read synchronously (not the default effect-deferred value) — this
  // component mounts already-revealed in ExploreStep, so an effect-deferred
  // read would let the stagger play once for a reduced-motion user before
  // flipping off a render later.
  const reducedMotion = useReducedMotion(false, { getInitialValueInEffect: false });
  return (
    <Stack gap="xs">
      <Title order={4}>{horizon.label}</Title>
      <MunsellChip
        colourText={horizon.colourText}
        hue={horizon.colourHue}
        value={horizon.colourValue}
        chroma={horizon.colourChroma}
        revealLabel={revealLabel}
      />
      {revealCharacteristics && horizon.characteristics.map((characteristic, index) => (
        <Text
          key={characteristic.id}
          size="sm"
          style={reducedMotion ? undefined : {
            animation: 'quest-feedback-rise 320ms ease-out both',
            animationDelay: `${index * 90}ms`
          }}
        >
          &bull; {characteristic.text}
        </Text>
      ))}
    </Stack>
  );
}

// The in-question soil pit: a tappable stack of real horizon bands over the
// actual monolith photo. Real Horizon.label values ("Horizon A"/"B"/"C") are
// neutral — confirmed against seed.ts, they're never the diagnostic-horizon
// answer text a mockup's own placeholder labels ("Orthic A", "Red Apedal B")
// would have been — so every label pill can stay visible all the time, the
// same way the mockup's do; tapping only highlights a band, it doesn't need
// to gate anything. Colour and characteristics stay behind the same
// reveal-gating QuestionScreen computes, and are only ever reachable through
// "Open the pit" (SoilPitModal). Bands are drawn at equal height: there's no
// real depth data behind this monolith (the flag raised earlier in this
// project's history — see the ticket), so varying band height would just be
// a second, subtler way of implying a depth measurement that doesn't exist.
function SoilPitGraphic({ monolith, activeHorizonId, onSelectHorizon, onOpenPit }: {
  monolith: Monolith;
  activeHorizonId: number | null;
  onSelectHorizon: (horizonId: number | null) => void;
  onOpenPit: () => void;
}) {
  return (
    <Stack
      gap="sm"
      w={220}
      align="center"
      style={{ flexShrink: 0 }}
    >
      <Box
        pos="relative"
        w={160}
        style={{
          borderRadius: 22,
          overflow: 'hidden',
          border: '6px solid #fdf8ee',
          boxShadow: '0 18px 40px rgba(86, 66, 40, 0.26)'
        }}
      >
        <Image
          src={monolith.imageUrl}
          alt="Soil pit"
          fit="cover"
        />
        {monolith.horizons.map((horizon, index) => {
          const isActive = horizon.id === activeHorizonId;
          const { top, h } = horizonBand(index, monolith.horizons.length);
          return (
            <UnstyledButton
              key={horizon.id}
              onClick={() => onSelectHorizon(isActive ? null : horizon.id)}
              aria-label={horizon.label}
              className="quest-pit-band"
              pos="absolute"
              left={0}
              right={0}
              top={top}
              h={h}
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                padding: 8,
                cursor: 'pointer',
                filter: isActive ? 'brightness(1.12)' : 'none',
                borderTop: index > 0 ? '2px dashed rgba(255, 248, 241, 0.5)' : 'none',
                transition: 'filter 180ms ease'
              }}
            >
              <Text
                fz={11}
                fw={800}
                px={10}
                py={4}
                style={{
                  borderRadius: 999,
                  background: isActive ? '#fff8f1' : 'rgba(255, 248, 241, 0.28)',
                  color: isActive ? 'var(--mantine-color-terracotta-8)' : '#fff8f1',
                  whiteSpace: 'nowrap',
                  transition: 'background 180ms ease, color 180ms ease'
                }}
              >
                {horizon.label}
              </Text>
            </UnstyledButton>
          );
        })}
      </Box>
      <Text
        fz="xs"
        fw={600}
        c="charcoal.7"
        ta="center"
        maw={220}
        px="sm"
        py={6}
        style={{
          background: '#fdf8ee', borderRadius: 12, boxShadow: 'var(--mantine-shadow-xs)'
        }}
      >
        Tap a layer to read its Munsell notation, texture and structure.
      </Text>
      <Button
        variant="white"
        color="terracotta"
        radius="xl"
        size="xs"
        onClick={onOpenPit}
      >
        Open soil profile info
      </Button>
    </Stack>
  );
}

// The full profile detail, reached from "Open the pit" — reuses the same
// gating-aware HorizonDetails the old hover reference used, and takes the
// exact same hide*ForHorizonId props QuestionScreen already computes, so
// opening this mid-question can't leak the colour/characteristics answer to
// a still-unanswered horizon-linked question the way a plain reuse of
// ExploreStep's ungated list would.
function SoilPitModal({
  monolith, opened, onClose, hideColourForHorizonId, hideCharacteristicsForHorizonId
}: {
  monolith: Monolith;
  opened: boolean;
  onClose: () => void;
  hideColourForHorizonId?: number | null;
  hideCharacteristicsForHorizonId?: number | null;
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Soil profile"
      radius="lg"
      size="md"
    >
      <Stack gap="lg">
        {monolith.horizons.map((horizon) => (
          <HorizonDetails
            key={horizon.id}
            horizon={horizon}
            revealLabel={horizon.id !== hideColourForHorizonId}
            revealCharacteristics={horizon.id !== hideCharacteristicsForHorizonId}
          />
        ))}
      </Stack>
    </Modal>
  );
}

function IntroStep({
  farmerName, farmOrderIndex, description, message, startLabel, onContinue, onReview
}: {
  farmerName: string;
  farmOrderIndex: number;
  // The farm's own blurb (Level.description) — scene-setting context read
  // before the farmer's ask, not something to invent copy for.
  description: string;
  message: string;
  startLabel: string;
  onContinue: () => void;
  // Omitted until the user has answered every question here — there's no
  // finished pass to review before that.
  onReview?: () => void;
}) {
  return (
    <Stack
      gap="lg"
      align="center"
    >
      <Flex
        gap="md"
        align="flex-start"
        wrap="wrap"
        justify="center"
      >
        <FarmerPortrait
          farmerName={farmerName}
          farmOrderIndex={farmOrderIndex}
        />
        <Paper
          radius="lg"
          p="lg"
          bg="moss.0"
          maw={420}
          style={{ boxShadow: 'var(--mantine-shadow-md)' }}
        >
          <Stack gap="xs">
            <Text
              fz="sm"
              fs="italic"
              c="charcoal.6"
            >
              {description}
            </Text>
            <Text c="charcoal.8">{message}</Text>
          </Stack>
        </Paper>
      </Flex>
      <Group
        gap="sm"
        justify="center"
      >
        {onReview && (
          <Button
            variant="light"
            color="moss"
            radius="xl"
            onClick={onReview}
          >
            Review Answers
          </Button>
        )}
        <Button
          color="terracotta"
          radius="xl"
          onClick={onContinue}
        >
          {startLabel}
        </Button>
      </Group>
    </Stack>
  );
}

function ExploreStep({ monolith, continueLabel, onContinue }: {
  monolith: Monolith;
  continueLabel: string;
  onContinue: () => void;
}) {
  const [activeHorizonId, setActiveHorizonId] = useState<number | null>(monolith.horizons[0]?.id ?? null);
  const activeHorizon: Horizon | undefined = monolith.horizons.find((h) => h.id === activeHorizonId);

  return (
    <Stack
      gap="lg"
      align="center"
    >
      <Text
        fw={600}
        c="charcoal.8"
        ta="center"
      >
        Examine the given soil profile. Select each layer to see its details.
      </Text>
      <Group
        align="flex-start"
        gap="xl"
        wrap="wrap"
        justify="center"
      >
        <Box
          pos="relative"
          w={220}
          style={{
            borderRadius: 22,
            overflow: 'hidden',
            border: '6px solid #fdf8ee',
            boxShadow: '0 18px 40px rgba(86, 66, 40, 0.26)'
          }}
        >
          <Image
            src={monolith.imageUrl}
            alt="Soil monolith"
            fit="cover"
          />
          {monolith.horizons.map((horizon, index) => {
            const isActive = horizon.id === activeHorizonId;
            const { top, h } = horizonBand(index, monolith.horizons.length);
            return (
              <UnstyledButton
                key={horizon.id}
                onClick={() => setActiveHorizonId(horizon.id)}
                aria-label={horizon.label}
                className="quest-pit-band"
                pos="absolute"
                left={0}
                right={0}
                top={top}
                h={h}
                style={{
                  cursor: 'pointer',
                  filter: isActive ? 'brightness(1.12)' : 'none',
                  borderTop: index > 0 ? '2px dashed rgba(255, 248, 241, 0.5)' : 'none',
                  transition: 'filter 180ms ease'
                }}
              />
            );
          })}
        </Box>

        <Card
          radius="lg"
          p="lg"
          w={280}
          bg="#fdf8ee"
          style={{ boxShadow: 'var(--mantine-shadow-md)' }}
        >
          {activeHorizon ? (
            <HorizonDetails horizon={activeHorizon} />
          ) : (
            <Text
              c="charcoal.5"
              fz="sm"
            >
              Select a layer to view its details.
            </Text>
          )}
        </Card>
      </Group>
      <Button
        color="terracotta"
        radius="xl"
        onClick={onContinue}
      >
        {continueLabel}
      </Button>
    </Stack>
  );
}

function optionBorderColor(
  option: { id: number; isCorrect: boolean; },
  revealed: boolean,
  selectedOptionId: string | null
): string | undefined {
  if (!revealed) return undefined;
  const isSelected = String(option.id) === selectedOptionId;
  if (option.isCorrect) return 'var(--mantine-color-green-6)';
  if (isSelected) return 'var(--mantine-color-red-6)';
  return undefined;
}

type PipStatus = 'correct' | 'incorrect' | 'current' | 'upcoming';

// The current question's own pip can't be read off `farm.questions` alone —
// that only reflects the last attempt refreshFarms() fetched, which for the
// in-progress question is either stale (a retry just changed it) or absent
// (nothing submitted yet this pass). Every other pip in the group is exactly
// what farm.questions already says.
function pipStatusFor(
  q: Question, isCurrent: boolean, currentRevealed: boolean, currentIsCorrect: boolean, farm: FarmProgress
): PipStatus {
  if (isCurrent) return currentRevealed ? (currentIsCorrect ? 'correct' : 'incorrect') : 'current';
  const progress = farm.questions.find((fq) => fq.questionId === q.id);
  if (progress?.isCorrect === true) return 'correct';
  if (progress?.isCorrect === false) return 'incorrect';
  return 'upcoming';
}

const pipColor: Record<PipStatus, string> = {
  correct: 'var(--mantine-color-moss-6)',
  incorrect: 'var(--mantine-color-terracotta-6)',
  current: 'var(--mantine-color-terracotta-6)',
  upcoming: 'var(--mantine-color-charcoal-3)'
};

// Only the current question's own pip ever transitions live within one
// mounted QuestionScreen (submit flips it current -> correct/incorrect
// without a remount) — every other pip in the row is fixed for the whole
// mount, so this only ever fires for that one pip.
function QuestionPip({ status, reducedMotion }: { status: PipStatus; reducedMotion: boolean; }) {
  const justResolved = useTransitionEffect(
    status,
    (previous, next) => previous === 'current' && (next === 'correct' || next === 'incorrect'),
    420
  );
  return (
    <Box
      w={status === 'current' ? 30 : 13}
      h={13}
      style={{
        borderRadius: 999,
        background: pipColor[status],
        transition: 'width 300ms ease, background 300ms ease',
        animation: justResolved && !reducedMotion ? 'quest-pip-fill 420ms ease-out' : 'none'
      }}
    />
  );
}

function ProgressPips({ questions, currentQuestionId, currentRevealed, currentIsCorrect, farm }: {
  questions: Question[];
  currentQuestionId: number;
  currentRevealed: boolean;
  currentIsCorrect: boolean;
  farm: FarmProgress;
}) {
  const reducedMotion = useReducedMotion(false, { getInitialValueInEffect: false });
  return (
    <Group gap={7}>
      {questions.map((q) => {
        const status = pipStatusFor(q, q.id === currentQuestionId, currentRevealed, currentIsCorrect, farm);
        return (
          <QuestionPip
            key={q.id}
            status={status}
            reducedMotion={reducedMotion}
          />
        );
      })}
    </Group>
  );
}

// A-B-C-D badges are visual only, matching the mockup exactly — it renders
// the same letters but never wires a keydown handler to them, so there's no
// real keyboard-shortcut feature to build here either.
function optionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

interface QuestionScreenProps {
  farm: FarmProgress;
  monolith: Monolith;
  question: Question;
  stepIndex: number;
  sameCategoryQuestions: Question[];
  selectedOptionId: string | null;
  onSelect: (value: string) => void;
  revealed: boolean;
  submitting: boolean;
  isReview: boolean;
  // Review mode reached a question the user skipped on their last pass, so
  // there's no answer of theirs to mark up.
  unanswered: boolean;
  farmerName: string;
  farmOrderIndex: number;
  onSubmit: () => void;
  onNext: () => void;
  onPrevious: () => void;
  canGoPrevious: boolean;
  onExit: () => void;
}

function QuestionScreen({
  farm, monolith, question, stepIndex, sameCategoryQuestions, selectedOptionId, onSelect, revealed, submitting,
  isReview, unanswered, farmerName, farmOrderIndex, onSubmit, onNext, onPrevious, canGoPrevious, onExit
}: QuestionScreenProps) {
  // Resets naturally whenever QuestRunnerInner remounts this component for a
  // new step (its own key includes stepIndex).
  const [activeHorizonId, setActiveHorizonId] = useState<number | null>(null);
  const [pitOpened, setPitOpened] = useState(false);
  const feedback = useAnswerFeedback();

  // Only set for a horizon-linked question (Question.horizonId) — undefined
  // for every other question type.
  const linkedHorizon = question.horizonId != null
    ? monolith.horizons.find((horizon) => horizon.id === question.horizonId)
    : undefined;
  // A horizon can have both a colour question and a characteristic
  // question, so which aspect THIS question tests has to be told apart:
  // a characteristic question's options are drawn from real
  // characteristics text (its own or another horizon's), which a colour
  // question's "value/chroma" options never are.
  const isCharacteristicQuestion = !!linkedHorizon && question.options.some(
    (option) => linkedHorizon.characteristics.some((characteristic) => characteristic.text === option.text)
  );
  const hideColourForHorizonId = !revealed && !isCharacteristicQuestion ? question.horizonId : null;
  const hideCharacteristicsForHorizonId = !revealed && isCharacteristicQuestion ? question.horizonId : null;

  const selectedOption = question.options.find((option) => String(option.id) === selectedOptionId);
  const answeredCorrectly = !!selectedOption?.isCorrect;
  const showFeedback = revealed && !unanswered;

  return (
    <Box
      mih="100dvh"
      pt={90}
      pb={80}
      px="xl"
      style={{ boxSizing: 'border-box' }}
    >
      <SoilPitModal
        monolith={monolith}
        opened={pitOpened}
        onClose={() => setPitOpened(false)}
        hideColourForHorizonId={hideColourForHorizonId}
        hideCharacteristicsForHorizonId={hideCharacteristicsForHorizonId}
      />

      <Group
        justify="space-between"
        align="flex-end"
        wrap="wrap"
        mb="lg"
      >
        <Group
          gap="md"
          align="center"
          wrap="wrap"
        >
          <Button
            variant="subtle"
            color="charcoal"
            radius="xl"
            size="xs"
            leftSection={<Icon name="ArrowLeft" />}
            onClick={onExit}
          >
            {isReview ? 'Exit Review' : 'Exit Quest'}
          </Button>
          <Stack gap={6}>
            <Text
              fz={13}
              fw={800}
              c="terracotta.8"
              tt="uppercase"
              style={{ letterSpacing: '0.08em' }}
            >
              {farm.name} &bull; {farmerName}
              {isReview && ' — Review'}
            </Text>
            <Title
              order={1}
              c="charcoal.9"
              fz={{
                base: 26, sm: 34
              }}
            >
              Day {stepIndex + 1} — {categoryLabels[question.category]}
            </Title>
          </Stack>
        </Group>
        <ProgressPips
          questions={sameCategoryQuestions}
          currentQuestionId={question.id}
          currentRevealed={revealed}
          currentIsCorrect={answeredCorrectly}
          farm={farm}
        />
      </Group>

      <Flex
        gap={40}
        align="flex-start"
        wrap="wrap"
      >
        <SoilPitGraphic
          monolith={monolith}
          activeHorizonId={activeHorizonId}
          onSelectHorizon={setActiveHorizonId}
          onOpenPit={() => setPitOpened(true)}
        />

        <Stack
          gap="lg"
          style={{
            flex: 1, minWidth: 280
          }}
          maw={620}
        >
          <Flex
            gap="md"
            align="flex-start"
          >
            <FarmerPortrait
              farmerName={farmerName}
              farmOrderIndex={farmOrderIndex}
            />
            <Paper
              radius="lg"
              p="lg"
              bg="#fdf8ee"
              style={{
                boxShadow: 'var(--mantine-shadow-md)', flex: 1
              }}
            >
              <Text
                fz={13}
                fw={800}
                c="terracotta.8"
                tt="uppercase"
                mb={4}
                style={{ letterSpacing: '0.08em' }}
              >
                {farmerName} asks
              </Text>
              <Text
                fz={22}
                fw={700}
                lh={1.3}
                c="charcoal.9"
              >
                {question.prompt}
              </Text>
            </Paper>
          </Flex>

          <Radio.Group
            value={selectedOptionId}
            onChange={onSelect}
          >
            <Stack gap="sm">
              {question.options.map((option, index) => {
                const borderColor = optionBorderColor(option, revealed, selectedOptionId);
                const isSelected = String(option.id) === selectedOptionId;
                const isCorrectOption = revealed && option.isCorrect;
                // Review mounts a question already-revealed, replaying an
                // answer from a previous pass — the wobble is a reaction to
                // the moment of answering, not something a read-only replay
                // of an old wrong pick should play on every mount.
                const isWrongSelected = !isReview && revealed && isSelected && !option.isCorrect;
                // Once revealed, every option except the selected one and
                // the correct one (the two the outline colour already
                // marks up) fades back so the two that matter stand out.
                const dimmed = revealed && !borderColor;
                const optionAnimation = isCorrectOption
                  ? feedback.correctOptionAnimation()
                  : isWrongSelected ? feedback.wrongOptionAnimation() : undefined;
                return (
                  <Radio.Card
                    key={option.id}
                    value={String(option.id)}
                    radius="xl"
                    p="md"
                    className="quest-option-row"
                    bg="#fdf8ee"
                    style={{
                      // `unanswered` only happens in review, where there's
                      // nothing to reveal but the options must still be inert.
                      pointerEvents: revealed || unanswered ? 'none' : undefined,
                      outline: borderColor
                        ? `3px solid ${borderColor}`
                        : isSelected ? '3px solid var(--mantine-color-terracotta-6)' : '3px solid transparent',
                      boxShadow: isSelected || isCorrectOption ? 'var(--mantine-shadow-md)' : 'var(--mantine-shadow-xs)',
                      opacity: dimmed ? 0.55 : 1,
                      animation: optionAnimation ?? 'none'
                    }}
                  >
                    <Group wrap="nowrap">
                      <Box
                        w={30}
                        h={30}
                        style={{
                          borderRadius: 999,
                          flex: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 14,
                          background: borderColor ?? (isSelected ? 'var(--mantine-color-terracotta-6)' : 'var(--mantine-color-charcoal-1)'),
                          color: borderColor || isSelected ? '#fff8f1' : 'var(--mantine-color-charcoal-6)'
                        }}
                      >
                        {optionLetter(index)}
                      </Box>
                      <Text
                        fw={700}
                        c="charcoal.9"
                      >
                        {option.text}
                      </Text>
                    </Group>
                  </Radio.Card>
                );
              })}
            </Stack>
          </Radio.Group>
          {unanswered && (
            <Text
              fw={600}
              c="charcoal.6"
            >
              You didn&rsquo;t answer this question.
            </Text>
          )}
        </Stack>

        {/* A sibling of the question column, not a block stacked under the
            options — so revealing the verdict doesn't push the options list
            (and the Next/Submit button below it) further down the page. */}
        {showFeedback && (
          <Paper
            radius="lg"
            p="lg"
            bg={answeredCorrectly ? '#eef6e0' : '#fff3e9'}
            style={{
              flex: '1 1 220px',
              maxWidth: 320,
              border: `2px solid ${answeredCorrectly ? '#cadfae' : '#f3d3ba'}`,
              animation: feedback.feedbackPanelAnimation() ?? 'none'
            }}
          >
            <Group
              gap="xs"
              wrap="nowrap"
              align="flex-start"
            >
              <Icon
                name={answeredCorrectly ? 'CheckCircle' : 'XCircle'}
                weight="fill"
                color={`var(--mantine-color-${answeredCorrectly ? 'moss' : 'terracotta'}-6)`}
                size={22}
              />
              <Stack gap={2}>
                <Text
                  fw={700}
                  fz="lg"
                  c={answeredCorrectly ? 'moss.8' : 'terracotta.8'}
                >
                  {answeredCorrectly ? 'That is the one.' : 'Not quite.'}
                </Text>
              </Stack>
            </Group>
          </Paper>
        )}
      </Flex>

      <Group
        justify="space-between"
        mt="xl"
      >
        {isReview && canGoPrevious ? (
          <Button
            variant="light"
            color="charcoal"
            radius="xl"
            onClick={onPrevious}
          >
            Previous
          </Button>
        ) : <div />}

        {/* Once an answer is revealed — right or wrong — the only way
            forward is Next: a wrong answer already shows the correct one
            above, in place, with no separate retry step. */}
        {(isReview || revealed) && (
          <Button
            color="terracotta"
            radius="xl"
            onClick={onNext}
          >
            Next
          </Button>
        )}
        {!isReview && !revealed && (
          <Button
            color="terracotta"
            radius="xl"
            loading={submitting}
            disabled={!selectedOptionId}
            onClick={onSubmit}
          >
            Submit Answer
          </Button>
        )}
      </Group>
    </Box>
  );
}

function harvestBarColor(percent: number): string {
  if (percent >= PASSING_SCORE_PERCENT) return 'moss';
  if (percent >= 50) return 'mustard';
  return 'terracotta';
}

function farmerScoreMessage(percent: number, farmName: string): string {
  if (percent === 100) {
    return `Perfect! You picked up on everything happening at ${farmName} — I couldn't have explained it better myself.`;
  }
  if (percent >= PASSING_SCORE_PERCENT) {
    return `Great work — you clearly understand most of what's going on at ${farmName}. Just a couple of details to brush up on.`;
  }
  if (percent >= 50) {
    return `You're on the right track with ${farmName}, but a few things still don't add up for me. Let's go over it again sometime.`;
  }
  return `Hmm, I don't think we quite got to the bottom of what's happening at ${farmName}. Maybe we should walk through this together again.`;
}

interface CompletionStepProps {
  farmerName: string;
  farmOrderIndex: number;
  farmName: string;
  correctCount: number;
  total: number;
  continueLabel: string;
  onContinue: () => void;
  onRetry: () => void;
  onReview: () => void;
}

// Reuses the same PASSING_SCORE_PERCENT cutoff harvestBarColor already keys
// off, rather than an unrelated confetti-specific threshold — a merely
// passing score gets a small celebratory burst, a perfect one gets a bigger
// two-part burst, and anything below passing gets none.
function celebrateCompletion(percent: number) {
  if (percent === 100) {
    void confetti({
      particleCount: 180,
      spread: 100,
      startVelocity: 45,
      origin: {
        x: 0.5, y: 0.6
      }
    });
    setTimeout(() => {
      void confetti({
        particleCount: 100,
        spread: 130,
        origin: {
          x: 0.5, y: 0.5
        }
      });
    }, 250);
    return;
  }
  if (percent >= PASSING_SCORE_PERCENT) {
    void confetti({
      particleCount: 70,
      spread: 70,
      origin: {
        x: 0.5, y: 0.6
      }
    });
  }
}

function CompletionStep({
  farmerName, farmOrderIndex, farmName, correctCount, total, continueLabel, onContinue, onRetry, onReview
}: CompletionStepProps) {
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // Runs once when this completion view mounts (QuestRunnerInner remounts on
  // a fresh key per step/mode, so this component only ever mounts once per
  // finished pass) rather than on every render.
  useEffect(() => {
    celebrateCompletion(percent);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberately fire-once-on-mount, not on every percent identity
  }, []);

  return (
    <Stack
      gap="lg"
      align="center"
    >
      <Text
        fz="xl"
        fw={700}
        c="moss.8"
      >
        Quest Complete!
      </Text>

      <Stack
        gap={6}
        w="100%"
        maw={420}
      >
        <Group justify="space-between">
          <Text
            fw={700}
            c="charcoal.8"
          >
            Harvest Score
          </Text>
          <Text
            fw={700}
            c="charcoal.8"
          >
            {percent}%
          </Text>
        </Group>
        <Progress
          value={percent}
          color={harvestBarColor(percent)}
          size="lg"
          radius="xl"
        />
        <Text
          fz="sm"
          c="charcoal.6"
          ta="center"
        >
          {correctCount} of {total} correct
        </Text>
      </Stack>

      <Flex
        gap="md"
        align="flex-start"
        wrap="wrap"
        justify="center"
      >
        <FarmerPortrait
          farmerName={farmerName}
          farmOrderIndex={farmOrderIndex}
        />
        <Paper
          radius="lg"
          p="lg"
          bg="moss.0"
          maw={420}
          style={{ boxShadow: 'var(--mantine-shadow-md)' }}
        >
          <Text c="charcoal.8">{farmerScoreMessage(percent, farmName)}</Text>
        </Paper>
      </Flex>
      <Group
        gap="sm"
        justify="center"
      >
        <Button
          variant="light"
          color="moss"
          radius="xl"
          onClick={onReview}
        >
          Review Answers
        </Button>
        <Button
          variant="light"
          color="terracotta"
          radius="xl"
          onClick={onRetry}
        >
          Retry Quest
        </Button>
        <Button
          color="terracotta"
          radius="xl"
          onClick={onContinue}
        >
          {continueLabel}
        </Button>
      </Group>
    </Stack>
  );
}

interface QuestRunnerInnerProps {
  farm: FarmProgress;
  monolith: Monolith;
  stepIndex: number;
  mode: Mode;
  // Set when the Quests page linked directly at a section; otherwise the phase
  // follows the normal intro -> explore -> question walk.
  initialPhase: Phase | undefined;
  nextFarm: FarmProgress | undefined;
  refreshFarms: () => Promise<void>;
}

function QuestRunnerInner({
  farm, monolith, stepIndex, mode, initialPhase, nextFarm, refreshFarms
}: QuestRunnerInnerProps) {
  const navigate = useNavigate();
  const {
    id: farmId, name: farmName, farmerName, orderIndex: farmOrderIndex
  } = farm;

  const questions = monolith.questions;
  const total = questions.length;
  const isComplete = stepIndex >= total;
  const question = isComplete ? undefined : questions[stepIndex];
  const isReview = mode === 'review';

  // Soil Family Code is graded one digit at a time, so several consecutive
  // steps now share a category label ("Day X: Soil Family Code") with only
  // the prompt distinguishing them — this makes that position explicit.
  // Generic over any category having more than one question, not just this
  // one, so it doesn't need updating if another category is ever split up
  // the same way.
  const sameCategoryQuestions = question ? questions.filter((q) => q.category === question.category) : [];
  const sameCategoryPosition = question
    ? sameCategoryQuestions.findIndex((q) => q.id === question.id) + 1
    : 0;
  const categoryHeading = question
    ? categoryLabels[question.category] + (sameCategoryQuestions.length > 1
      ? ` (${sameCategoryPosition} of ${sameCategoryQuestions.length})`
      : '')
    : '';

  // Only ever consulted in review mode. In play mode a previous answer must
  // stay invisible — pre-filling it here is exactly what makes a retry feel
  // like a continuation instead of a fresh attempt.
  const storedOptionId = isReview && question
    ? farm.questions.find((q) => q.questionId === question.id)?.selectedOptionId ?? null
    : null;

  // QuestRunnerInner is remounted (via a `${farm.id}-${stepIndex}-${mode}` key
  // in QuestRunner below) whenever the step or mode changes, so these reset for
  // free — no effect needed to sync them back.
  //
  // Review jumps straight to the answer: the farmer's overview is the entry
  // point for playing a quest, not for re-reading one.
  const [phase, setPhase] = useState<Phase>(
    initialPhase ?? (stepIndex === 0 && !isReview ? 'intro' : 'question')
  );
  const linkedToProfile = initialPhase === 'explore';
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    storedOptionId != null ? String(storedOptionId) : null
  );
  const [revealed, setRevealed] = useState(storedOptionId != null);
  const [submitting, setSubmitting] = useState(false);
  const [celebratingAchievement, setCelebratingAchievement] = useState(false);
  const reducedMotion = useReducedMotion(false, { getInitialValueInEffect: false });
  const celebrationTimeoutRef = useRef<number | null>(null);
  useEffect(() => () => {
    if (celebrationTimeoutRef.current != null) window.clearTimeout(celebrationTimeoutRef.current);
  }, []);

  // Doesn't change when an unlock is triggered (still fires right off the
  // submit response) — only adds a brief glow beat before the existing
  // toast, unless reduced motion is set, in which case the toast fires with
  // no beat at all.
  function celebrateAchievementUnlock(newlyUnlockedAchievements: Achievement[]) {
    if (newlyUnlockedAchievements.length === 0) return;
    if (reducedMotion) {
      showAchievementUnlockToast(newlyUnlockedAchievements);
      return;
    }
    setCelebratingAchievement(true);
    celebrationTimeoutRef.current = window.setTimeout(() => {
      setCelebratingAchievement(false);
      showAchievementUnlockToast(newlyUnlockedAchievements);
    }, ACHIEVEMENT_ANTICIPATION_MS);
  }

  // Timestamp the current question was first shown, used as the attempt's
  // startedAt so time-on-task reflects real elapsed time rather than the
  // near-zero gap between server-side startedAt/completedAt at submit-time.
  // Recomputed only when this instance's phase actually reaches 'question'
  // (once per mount — phase only ever moves intro/explore -> question).
  // Adjusts state during render (the React-endorsed pattern for deriving
  // state from a changed value) rather than in an effect, so it takes effect
  // in the same render instead of triggering an extra one.
  const [questionShownAt, setQuestionShownAt] = useState<string>(() => new Date().toISOString());
  const [shownAtPhase, setShownAtPhase] = useState(phase);
  if (phase !== shownAtPhase) {
    setShownAtPhase(phase);
    if (!isComplete && phase === 'question') {
      setQuestionShownAt(new Date().toISOString());
    }
  }

  // Scoring happens server-side, so this farm's fresh score only exists once
  // refreshFarms() resolves — until then, show a loader rather than a stale
  // (pre-quest) score.
  const [scoreLoading, setScoreLoading] = useState(isComplete);

  useEffect(() => {
    if (!isComplete) return;
    let cancelled = false;
    refreshFarms().finally(() => {
      if (!cancelled) setScoreLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isComplete, refreshFarms]);

  function goToStep(index: number) {
    navigate(`/quests/${farmId}/${index}${isReview ? '?mode=review' : ''}`);
  }

  // Both drop any ?mode, so a retry always starts a clean play run.
  function startReview() {
    navigate(`/quests/${farmId}/0?mode=review`);
  }

  function startRetry() {
    navigate(`/quests/${farmId}/0`);
  }

  async function handleSubmitAnswer() {
    if (!question) return;
    if (!selectedOptionId) {
      // A toast rather than inline page text: the question column can run
      // taller than the viewport, and inline text near the button (or up in
      // the header) can end up scrolled out of view right when it matters.
      // Notifications render through Mantine's own portal, so they show up
      // top-right regardless of scroll position — same as the achievement
      // toasts already used on this page.
      notifications.show({
        message: 'Please select an answer.', color: 'terracotta'
      });
      return;
    }
    setSubmitting(true);
    try {
      const session = await authApi.getSession();
      if (!session) throw new Error('Not authenticated');
      const result = await userApi.submitAttempt(session.access_token, question.id, Number(selectedOptionId), questionShownAt);
      setRevealed(true);
      celebrateAchievementUnlock(result.newlyUnlockedAchievements);
    } catch (submitError) {
      console.error('Failed to submit attempt', submitError);
      notifications.show({
        message: 'Failed to submit your answer. Please try again.', color: 'red'
      });
    } finally {
      setSubmitting(false);
    }
  }

  const correctCount = farm.questions.filter((q) => q.isCorrect).length;
  const attempted = hasAttempted(farm);
  const finished = hasFinished(farm);

  // The question phase gets its own wide, unconstrained layout (pit +
  // question side by side) instead of the maw=900 shell everything else
  // uses — it scrolls the ordinary page way (via the app's existing
  // ScrollSmoother) when content runs taller than the viewport.
  if (!isComplete && phase === 'question' && question) {
    return (
      <>
        {celebratingAchievement && <AchievementGlowBeat />}
        <QuestionScreen
          farm={farm}
          monolith={monolith}
          question={question}
          stepIndex={stepIndex}
          sameCategoryQuestions={sameCategoryQuestions}
          selectedOptionId={selectedOptionId}
          onSelect={setSelectedOptionId}
          revealed={revealed}
          submitting={submitting}
          isReview={isReview}
          unanswered={isReview && storedOptionId === null}
          farmerName={farmerName}
          farmOrderIndex={farmOrderIndex}
          onSubmit={handleSubmitAnswer}
          onNext={() => goToStep(stepIndex + 1)}
          onPrevious={() => goToStep(stepIndex - 1)}
          canGoPrevious={stepIndex > 0}
          onExit={() => navigate('/quests')}
        />
      </>
    );
  }

  return (
    <>
      {celebratingAchievement && <AchievementGlowBeat />}
      <Box
        px="xl"
        pt={90}
        pb={80}
        maw={900}
        mx="auto"
      >
        <Stack gap="xl">
          <Stack gap={6}>
            <Text
              fz={13}
              fw={800}
              c="terracotta.8"
              tt="uppercase"
              style={{ letterSpacing: '0.08em' }}
            >
              {farmName} &bull; {farmerName}
            </Text>
            <Title
              order={1}
              c="charcoal.9"
              fz={{
                base: 26, sm: 34
              }}
            >
              {isComplete ? 'Day Complete' : `Day ${stepIndex + 1} — ${categoryHeading}`}
              {isReview && ' — Review'}
            </Title>
          </Stack>

          {isComplete && scoreLoading && (
            <Stack
              align="center"
              py="xl"
            >
              <Loader color="terracotta" />
            </Stack>
          )}
          {isComplete && !scoreLoading && (
            <CompletionStep
              farmerName={farmerName}
              farmOrderIndex={farmOrderIndex}
              farmName={farmName}
              correctCount={correctCount}
              total={total}
              continueLabel={nextFarm ? 'Next Quest' : 'Back to Quests'}
              onContinue={() => navigate(nextFarm ? `/quests/${nextFarm.id}/0` : '/quests')}
              onRetry={startRetry}
              onReview={startReview}
            />
          )}
          {!isComplete && phase === 'intro' && (
            <IntroStep
              farmerName={farmerName}
              farmOrderIndex={farmOrderIndex}
              description={farm.description}
              message={farm.scenario}
              startLabel={attempted ? 'Retry Quest' : 'Start Quest'}
              onContinue={() => setPhase('explore')}
              onReview={finished ? startReview : undefined}
            />
          )}
          {!isComplete && phase === 'explore' && (
            <ExploreStep
              monolith={monolith}
              // Linked straight here from the Quests dropdown, this is a
              // read-the-profile visit, not the middle of a run — walking on
              // into the questions would start recording a new attempt the user
              // never asked for. Send them back instead.
              continueLabel={linkedToProfile ? 'Back to Quests' : 'Continue'}
              onContinue={() => (linkedToProfile ? navigate('/quests') : setPhase('question'))}
            />
          )}
        </Stack>
      </Box>
    </>
  );
}

function QuestRunner() {
  const { farmId, stepIndex } = useParams<{ farmId: string; stepIndex: string; }>();
  const [searchParams] = useSearchParams();
  const { farms, loading: userLoading, refreshFarms } = useUser();
  const { monoliths, loading: monolithsLoading } = useMonoliths();

  // Anything other than an explicit ?mode=review plays the quest, so a
  // hand-typed or stale mode value can't leave someone in a half-review state.
  const mode: Mode = searchParams.get('mode') === 'review' ? 'review' : 'play';

  // The Quests page links straight at a quest's soil profile; anything else in
  // ?phase falls back to the normal walk through the quest.
  const requestedPhase = searchParams.get('phase');
  const initialPhase: Phase | undefined = requestedPhase === 'explore' ? 'explore' : undefined;

  if (userLoading || monolithsLoading) {
    return (
      <>
        <StaticMountainScene />
        <Stack
          align="center"
          justify="center"
          mih="60vh"
        >
          <Loader color="terracotta" />
        </Stack>
      </>
    );
  }

  const farm = farms?.find((f) => String(f.id) === farmId);
  // Levels and monoliths are seeded 1:1 by orderIndex/levelNumber (see
  // prisma/seed.ts) — FarmProgress carries no monolith id, so this is the
  // only join available on the client.
  const monolith = farm ? monoliths.find((m) => m.orderIndex === farm.orderIndex) : undefined;

  if (!farm || !monolith) {
    return (
      <Navigate
        to="/quests"
        replace
      />
    );
  }

  const parsedStep = Number(stepIndex);
  const clampedStep = Number.isFinite(parsedStep)
    ? Math.min(Math.max(parsedStep, 0), monolith.questions.length)
    : 0;

  if (String(clampedStep) !== stepIndex) {
    // Carries ?mode / ?phase through, so a clamped step doesn't silently drop
    // someone out of review or off the section they asked for.
    const query = searchParams.toString();
    return (
      <Navigate
        to={`/quests/${farm.id}/${clampedStep}${query ? `?${query}` : ''}`}
        replace
      />
    );
  }

  const nextFarm = farms?.find((f) => f.orderIndex === farm.orderIndex + 1);

  return (
    <>
      <StaticMountainScene />
      <QuestRunnerInner
        key={`${farm.id}-${clampedStep}-${mode}-${initialPhase ?? ''}`}
        farm={farm}
        monolith={monolith}
        stepIndex={clampedStep}
        mode={mode}
        initialPhase={initialPhase}
        nextFarm={nextFarm}
        refreshFarms={refreshFarms}
      />
    </>
  );
}

export default QuestRunner;
