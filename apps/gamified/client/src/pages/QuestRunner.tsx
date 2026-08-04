import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import {
  ActionIcon, Avatar, Box, Button, Card, Flex, Group, Image, Loader, Paper, Progress, Radio, Stack, Text, Title, UnstyledButton
} from '@mantine/core';
import type { Horizon, Monolith, Question } from '@shared/api/models/monolith.model';
import { Icon } from '@shared/ui/Icon';
import { useUser } from '../context/UserContext';
import { useMonoliths } from '../hooks/useMonoliths';
import { useQuestProgress } from '../hooks/useQuestProgress';
import { categoryLabels } from '../lib/questionCategory';
import MunsellChip from '../components/MunsellChip';
import level1Pieter from '../assets/farmers/level-1-pieter.png';
import level2Nomsa from '../assets/farmers/level-2-nomsa.png';
import level3Willem from '../assets/farmers/level-3-willem.png';

// Keyed by orderIndex (levelNumber), matching the convention in FarmRoad.tsx
// and FarmerProgressGrid.tsx.
const farmerImages: Record<number, string> = {
  1: level1Pieter,
  2: level2Nomsa,
  3: level3Willem
};

type Phase = 'intro' | 'explore' | 'question';

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

function SoilProfileReference({ monolith }: { monolith: Monolith; }) {
  return (
    <Stack
      gap={4}
      align="center"
      w={170}
      style={{ flexShrink: 0 }}
    >
      <Image
        src={monolith.imageUrl}
        alt={`${monolith.name} soil profile`}
        w={150}
        radius="md"
        style={{ border: '1px solid var(--mantine-color-charcoal-2)' }}
      />
      <Text
        fz="xs"
        c="charcoal.5"
        ta="center"
      >
        {monolith.name} profile
      </Text>
    </Stack>
  );
}

function IntroStep({ farmerName, farmOrderIndex, message, onContinue }: {
  farmerName: string;
  farmOrderIndex: number;
  message: string;
  onContinue: () => void;
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
      <Button
        color="terracotta"
        radius="xl"
        onClick={onContinue}
      >
        Continue
      </Button>
    </Stack>
  );
}

function ExploreStep({ monolith, onContinue }: { monolith: Monolith; onContinue: () => void; }) {
  const [activeHorizonId, setActiveHorizonId] = useState<number | null>(monolith.horizons[0]?.id ?? null);
  const activeHorizon: Horizon | undefined = monolith.horizons.find((h) => h.id === activeHorizonId);
  const bandHeight = 100 / monolith.horizons.length;

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
        Examine {monolith.name}&rsquo;s soil profile. Select each layer to see its details.
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
            alt={`${monolith.name} soil monolith`}
            radius="md"
          />
          {monolith.horizons.map((horizon, index) => {
            const isActive = horizon.id === activeHorizonId;
            return (
              <UnstyledButton
                key={horizon.id}
                onClick={() => setActiveHorizonId(horizon.id)}
                aria-label={horizon.label}
                pos="absolute"
                left={0}
                right={0}
                top={`${bandHeight * index}%`}
                h={`${bandHeight}%`}
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
            <Stack gap="xs">
              <Title order={4}>{activeHorizon.label}</Title>
              <MunsellChip
                colourText={activeHorizon.colourText}
                hue={activeHorizon.colourHue}
                value={activeHorizon.colourValue}
                chroma={activeHorizon.colourChroma}
              />
              {activeHorizon.characteristics.map((characteristic) => (
                <Text
                  key={characteristic.id}
                  size="sm"
                >
                  &bull; {characteristic.text}
                </Text>
              ))}
            </Stack>
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
        Continue
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
  isCorrect: boolean;
  error: string | null;
}

function QuestionStep({
  monolith, question, selectedOptionId, onSelect, revealed, isCorrect, error
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
                    pointerEvents: revealed ? 'none' : undefined,
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
        {revealed && (
          <Text
            fw={600}
            c={isCorrect ? 'green.7' : 'red.7'}
          >
            {isCorrect ? 'Correct!' : 'Incorrect — the correct answer is outlined in green.'}
          </Text>
        )}
      </Stack>
    </Flex>
  );
}

function harvestBarColor(percent: number): string {
  if (percent >= 75) return 'moss';
  if (percent >= 50) return 'mustard';
  return 'terracotta';
}

function farmerScoreMessage(percent: number, farmName: string): string {
  if (percent === 100) {
    return `Perfect! You picked up on everything happening at ${farmName} — I couldn't have explained it better myself.`;
  }
  if (percent >= 75) {
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
  buttonLabel: string;
  onContinue: () => void;
}

function CompletionStep({
  farmerName, farmOrderIndex, farmName, correctCount, total, buttonLabel, onContinue
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
      <Button
        color="terracotta"
        radius="xl"
        onClick={onContinue}
      >
        {buttonLabel}
      </Button>
    </Stack>
  );
}

interface QuestRunnerInnerProps {
  farmId: number;
  farmName: string;
  farmerName: string;
  farmOrderIndex: number;
  monolith: Monolith;
  stepIndex: number;
  nextFarmId: number | undefined;
  progress: Record<number, (number | undefined)[]>;
  markAnswered: (farmId: number, questionIndex: number, selectedOptionId: number, questionCount: number) => void;
}

function QuestRunnerInner({
  farmId, farmName, farmerName, farmOrderIndex, monolith, stepIndex, nextFarmId, progress, markAnswered
}: QuestRunnerInnerProps) {
  const navigate = useNavigate();

  const questions = monolith.questions;
  const total = questions.length;
  const isComplete = stepIndex >= total;
  const question = isComplete ? undefined : questions[stepIndex];
  const storedOptionId = progress[farmId]?.[stepIndex];

  // QuestRunnerInner is remounted (via a `${farm.id}-${stepIndex}` key in
  // QuestRunner below) whenever the step changes, so these reset for free —
  // no effect needed to sync them back when stepIndex changes.
  const [phase, setPhase] = useState<Phase>(stepIndex === 0 ? 'intro' : 'question');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(
    storedOptionId !== undefined ? String(storedOptionId) : null
  );
  const [revealed, setRevealed] = useState(storedOptionId !== undefined);
  const [error, setError] = useState<string | null>(null);

  function goToStep(index: number) {
    navigate(`/quests/${farmId}/${index}`);
  }

  function handleSubmitAnswer() {
    if (!question) return;
    if (!selectedOptionId) {
      setError('Please select an answer.');
      return;
    }
    setError(null);
    setRevealed(true);
    markAnswered(farmId, stepIndex, Number(selectedOptionId), total);
  }

  const correctOptionId = question?.options.find((option) => option.isCorrect)?.id;
  const isCorrect = revealed && correctOptionId !== undefined && String(correctOptionId) === selectedOptionId;

  const answers = progress[farmId] ?? [];
  const correctCount = questions.filter((q, index) => {
    const picked = answers[index];
    return picked !== undefined && q.options.find((option) => option.isCorrect)?.id === picked;
  }).length;

  return (
    <Stack
      maw={900}
      mx="auto"
      gap="lg"
    >
      <Title
        order={1}
        c="charcoal.9"
      >
        Quest {farmOrderIndex}: {farmerName}
      </Title>

      <Card
        withBorder
        radius="xl"
        p={0}
        style={{ overflow: 'hidden' }}
      >
        <Group
          justify="space-between"
          px="md"
          py="xs"
          style={{ borderBottom: '1px solid var(--mantine-color-charcoal-2)' }}
        >
          <ActionIcon
            variant="subtle"
            color="charcoal"
            disabled={stepIndex <= 0}
            onClick={() => goToStep(stepIndex - 1)}
            aria-label="Previous day"
          >
            <Icon
              name="CaretLeft"
              size={18}
            />
          </ActionIcon>
          <Text
            fw={700}
            c="charcoal.8"
          >
            {isComplete ? 'Day Complete' : `Day ${stepIndex + 1}: ${categoryLabels[question!.category]}`}
          </Text>
          <ActionIcon
            variant="subtle"
            color="charcoal"
            disabled={stepIndex >= total}
            onClick={() => goToStep(stepIndex + 1)}
            aria-label="Next day"
          >
            <Icon
              name="CaretRight"
              size={18}
            />
          </ActionIcon>
        </Group>

        <Box p="xl">
          {isComplete && (
            <CompletionStep
              farmerName={farmerName}
              farmOrderIndex={farmOrderIndex}
              farmName={farmName}
              correctCount={correctCount}
              total={total}
              buttonLabel={nextFarmId ? 'Next Quest' : 'Back to Quests'}
              onContinue={() => (nextFarmId ? navigate(`/quests/${nextFarmId}/0`) : navigate('/quests'))}
            />
          )}
          {!isComplete && phase === 'intro' && (
            <IntroStep
              farmerName={farmerName}
              farmOrderIndex={farmOrderIndex}
              message={`Every season I run into trouble on ${farmName}. Can you help me work out what's going on with my soil?`}
              onContinue={() => setPhase('explore')}
            />
          )}
          {!isComplete && phase === 'explore' && (
            <ExploreStep
              monolith={monolith}
              onContinue={() => setPhase('question')}
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
              isCorrect={isCorrect}
              error={error}
            />
          )}
        </Box>
      </Card>

      {!isComplete && phase === 'question' && (
        <Group justify="space-between">
          <Button
            variant="subtle"
            color="charcoal"
            radius="xl"
            onClick={() => navigate('/quests')}
          >
            Exit Quest
          </Button>
          {!revealed && (
            <Button
              color="terracotta"
              radius="xl"
              onClick={handleSubmitAnswer}
            >
              Submit Answer
            </Button>
          )}
          {revealed && (
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
    </Stack>
  );
}

function QuestRunner() {
  const { farmId, stepIndex } = useParams<{ farmId: string; stepIndex: string; }>();
  const { user, farms, loading: userLoading } = useUser();
  const { monoliths, loading: monolithsLoading } = useMonoliths();
  const { progress, markAnswered } = useQuestProgress(user?.supabaseId);

  if (userLoading || monolithsLoading) {
    return (
      <Stack
        align="center"
        justify="center"
        mih="60vh"
      >
        <Loader color="terracotta" />
      </Stack>
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
    return (
      <Navigate
        to={`/quests/${farm.id}/${clampedStep}`}
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
    >
      <QuestRunnerInner
        key={`${farm.id}-${clampedStep}`}
        farmId={farm.id}
        farmName={farm.name}
        farmerName={farm.farmerName}
        farmOrderIndex={farm.orderIndex}
        monolith={monolith}
        stepIndex={clampedStep}
        nextFarmId={nextFarm?.id}
        progress={progress}
        markAnswered={markAnswered}
      />
    </Box>
  );
}

export default QuestRunner;
