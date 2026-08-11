import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import {
  Avatar, Box, Button, Card, Flex, Group, HoverCard, Image, Loader, Paper, Progress, Radio, Stack, Text, Title, UnstyledButton
} from '@mantine/core';
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

function AssistantPortrait() {
  return (
    <Stack
      gap={6}
      align="center"
      w={110}
    >
      <Flex
        align="center"
        justify="center"
        style={{
          width: 90,
          height: 90,
          borderRadius: '50%',
          backgroundColor: 'var(--mantine-color-terracotta-1)',
          border: '3px solid var(--mantine-color-terracotta-6)'
        }}
      >
        <Icon
          name="ChatCircleDots"
          size={40}
          weight="fill"
          color="var(--mantine-color-terracotta-7)"
        />
      </Flex>
      <Text
        fz="sm"
        fw={600}
        c="charcoal.8"
        ta="center"
      >
        Assistant
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

function HorizonDetails({ horizon }: { horizon: Horizon; }) {
  return (
    <Stack gap="xs">
      <Title order={4}>{horizon.label}</Title>
      <MunsellChip
        colourText={horizon.colourText}
        hue={horizon.colourHue}
        value={horizon.colourValue}
        chroma={horizon.colourChroma}
      />
      {horizon.characteristics.map((characteristic) => (
        <Text
          key={characteristic.id}
          size="sm"
        >
          &bull; {characteristic.text}
        </Text>
      ))}
    </Stack>
  );
}

// The same profile the explore step shows, kept beside the questions so the
// horizon details stay reachable without leaving the question — hover only, so
// it can't be mistaken for part of answering.
function SoilProfileReference({ monolith }: { monolith: Monolith; }) {
  return (
    <Stack
      gap={4}
      align="center"
      w={170}
      style={{ flexShrink: 0 }}
    >
      <Box
        pos="relative"
        w={150}
      >
        <Image
          src={monolith.imageUrl}
          alt="Soil profile"
          radius="md"
          style={{ border: '1px solid var(--mantine-color-charcoal-2)' }}
        />
        {monolith.horizons.map((horizon, index) => {
          const { top, h } = horizonBand(index, monolith.horizons.length);
          return (
            <HoverCard
              key={horizon.id}
              width={280}
              position="right"
              withArrow
              shadow="md"
              openDelay={80}
            >
              <HoverCard.Target>
                <Box
                  pos="absolute"
                  left={0}
                  right={0}
                  top={top}
                  h={h}
                  aria-label={horizon.label}
                  style={{
                    borderRadius: 4,
                    border: '1px dashed var(--mantine-color-charcoal-3)',
                    cursor: 'help'
                  }}
                />
              </HoverCard.Target>
              <HoverCard.Dropdown>
                <HorizonDetails horizon={horizon} />
              </HoverCard.Dropdown>
            </HoverCard>
          );
        })}
      </Box>
      <Text
        fz="xs"
        c="charcoal.5"
        ta="center"
      >
        Soil profile — hover a layer for its details
      </Text>
    </Stack>
  );
}

function IntroStep({
  farmerName, farmOrderIndex, message, startLabel, onContinue, onReview
}: {
  farmerName: string;
  farmOrderIndex: number;
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
          style={{ border: '1px solid var(--mantine-color-moss-2)' }}
        >
          <Text c="charcoal.8">{message}</Text>
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
        >
          <Image
            src={monolith.imageUrl}
            alt="Soil monolith"
            radius="md"
          />
          {monolith.horizons.map((horizon, index) => {
            const isActive = horizon.id === activeHorizonId;
            const { top, h } = horizonBand(index, monolith.horizons.length);
            return (
              <UnstyledButton
                key={horizon.id}
                onClick={() => setActiveHorizonId(horizon.id)}
                aria-label={horizon.label}
                pos="absolute"
                left={0}
                right={0}
                top={top}
                h={h}
                style={{
                  borderRadius: 6,
                  border: isActive
                    ? '3px solid var(--mantine-color-terracotta-6)'
                    : '2px solid var(--mantine-color-charcoal-3)',
                  boxShadow: isActive ? 'inset 0 0 0 2px var(--mantine-color-terracotta-2)' : 'none',
                  transition: 'border-color 150ms ease, box-shadow 150ms ease'
                }}
              />
            );
          })}
        </Box>

        <Card
          withBorder
          radius="lg"
          p="lg"
          w={280}
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

interface QuestionStepProps {
  monolith: Monolith;
  question: Question;
  selectedOptionId: string | null;
  onSelect: (value: string) => void;
  revealed: boolean;
  error: string | null;
  // Review mode reached a question the user skipped on their last pass, so
  // there's no answer of theirs to mark up.
  unanswered: boolean;
}

function QuestionStep({
  monolith, question, selectedOptionId, onSelect, revealed, error, unanswered
}: QuestionStepProps) {
  return (
    <Flex
      gap="xl"
      align="flex-start"
      wrap="wrap"
      justify="center"
    >
      <SoilProfileReference monolith={monolith} />

      <Stack
        gap="lg"
        style={{
          flex: 1, minWidth: 280 
        }}
        maw={520}
      >
        <Flex
          gap="md"
          align="flex-start"
        >
          <AssistantPortrait />
          <Paper
            radius="lg"
            p="lg"
            bg="terracotta.0"
            style={{
              border: '1px solid var(--mantine-color-terracotta-1)', flex: 1 
            }}
          >
            <Text c="charcoal.8">{question.prompt}</Text>
          </Paper>
        </Flex>

        <Radio.Group
          value={selectedOptionId}
          onChange={onSelect}
        >
          <Stack gap="sm">
            {question.options.map((option) => {
              const borderColor = optionBorderColor(option, revealed, selectedOptionId);
              return (
                <Radio.Card
                  key={option.id}
                  value={String(option.id)}
                  radius="xl"
                  p="md"
                  style={{
                    // `unanswered` only happens in review, where there's
                    // nothing to reveal but the options must still be inert.
                    pointerEvents: revealed || unanswered ? 'none' : undefined,
                    border: borderColor ? `2px solid ${borderColor}` : undefined
                  }}
                >
                  <Group>
                    <Radio.Indicator />
                    <Text>{option.text}</Text>
                  </Group>
                </Radio.Card>
              );
            })}
          </Stack>
        </Radio.Group>
        {error && <Text c="red.7">{error}</Text>}
        {unanswered && (
          <Text
            fw={600}
            c="charcoal.6"
          >
            You didn&rsquo;t answer this question.
          </Text>
        )}
      </Stack>
    </Flex>
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

function CompletionStep({
  farmerName, farmOrderIndex, farmName, correctCount, total, continueLabel, onContinue, onRetry, onReview
}: CompletionStepProps) {
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

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
          style={{ border: '1px solid var(--mantine-color-moss-2)' }}
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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
      setError('Please select an answer.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const session = await authApi.getSession();
      if (!session) throw new Error('Not authenticated');
      await userApi.submitAttempt(session.access_token, question.id, Number(selectedOptionId));
      setRevealed(true);
    } catch (submitError) {
      console.error('Failed to submit attempt', submitError);
      setError('Failed to submit your answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const correctCount = farm.questions.filter((q) => q.isCorrect).length;
  const attempted = hasAttempted(farm);
  const finished = hasFinished(farm);

  return (
    <Stack gap="md">
      <Paper
        radius="lg"
        shadow="sm"
        p="lg"
        style={{ border: '1px solid var(--mantine-color-charcoal-2)' }}
      >
        <Title
          order={1}
          c="charcoal.9"
        >
          Quest {farmOrderIndex}: {farmerName}
        </Title>
      </Paper>

      <Paper
        radius="lg"
        shadow="sm"
        p={0}
        style={{
          overflow: 'hidden', border: '1px solid var(--mantine-color-charcoal-2)' 
        }}
      >
        <Group
          justify="center"
          px="md"
          py="xs"
          style={{ borderBottom: '1px solid var(--mantine-color-charcoal-2)' }}
        >
          <Text
            fw={700}
            c="charcoal.8"
          >
            {isComplete ? 'Day Complete' : `Day ${stepIndex + 1}: ${categoryLabels[question!.category]}`}
            {isReview && ' — Review'}
          </Text>
        </Group>

        <Box p="xl">
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
              message={`Every season I run into trouble on ${farmName}. Can you help me work out what's going on with my soil?`}
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
          {!isComplete && phase === 'question' && question && (
            <QuestionStep
              monolith={monolith}
              question={question}
              selectedOptionId={selectedOptionId}
              onSelect={(value) => {
                setSelectedOptionId(value);
                setError(null);
              }}
              revealed={revealed}
              error={error}
              unanswered={isReview && storedOptionId === null}
            />
          )}
        </Box>

        {!isComplete && phase === 'question' && (
          <Group
            justify="space-between"
            px="xl"
            pb="xl"
          >
            <Button
              variant="subtle"
              color="charcoal"
              radius="xl"
              onClick={() => navigate('/quests')}
            >
              {isReview ? 'Exit Review' : 'Exit Quest'}
            </Button>
            {/* Only review needs to step backwards — a play run is a fresh
                attempt, so there's nothing behind you to go back and look at. */}
            {isReview && stepIndex > 0 && (
              <Button
                variant="light"
                color="charcoal"
                radius="xl"
                onClick={() => goToStep(stepIndex - 1)}
                ml="auto"
                mr="sm"
              >
                Previous
              </Button>
            )}
            {/* Review submits nothing, so it always offers Next — including on an
                unanswered question, where there's no answer to reveal. */}
            {!isReview && !revealed && (
              <Button
                color="terracotta"
                radius="xl"
                loading={submitting}
                onClick={handleSubmitAnswer}
              >
                Submit Answer
              </Button>
            )}
            {(isReview || revealed) && (
              <Button
                color="terracotta"
                radius="xl"
                onClick={() => goToStep(stepIndex + 1)}
              >
                Next
              </Button>
            )}
          </Group>
        )}
      </Paper>
    </Stack>
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
    <Box
      px="xl"
      pt={140}
      pb={80}
      maw={900}
      mx="auto"
    >
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
    </Box>
  );
}

export default QuestRunner;
