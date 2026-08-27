import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router';
import {
  Button, Group, Image, Loader, Radio, Stack, Text, Title
} from '@mantine/core';
import type { Horizon, Monolith, Question } from '@shared/api/models/monolith.model';
import { authApi } from '@shared/api/services/auth.api';
import { userApi } from '@shared/api/services/users.api';
import { useContent } from '../context/ContentContext';
import MunsellChip from '../components/MunsellChip';
import SectionCard from '../components/SectionCard';

type Step =
  | { kind: 'monolith'; }
  | { kind: 'question'; question: Question; };

function buildSteps(monolith: Monolith): Step[] {
  return [
    { kind: 'monolith' },
    ...monolith.questions.map((question): Step => ({
      kind: 'question', question
    }))
  ];
}

function MonolithStepView({ monolith }: { monolith: Monolith; }) {
  const [activeHorizonId, setActiveHorizonId] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setActiveHorizonId(null);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const activeHorizon: Horizon | undefined = monolith.horizons.find((h) => h.id === activeHorizonId);
  const bandHeight = 100 / monolith.horizons.length;

  return (
    <Stack align="center" gap="lg">
      <Text fw={600}>Examine the soil profile. Select each horizon to view its characteristics.</Text>
      <Group
        align="flex-start"
        gap="xl"
        wrap="wrap"
        justify="center"
      >
        <div style={{
          position: 'relative', width: 220
        }}
        >
          <Image
            src={monolith.imageUrl}
            alt="Soil profile"
            radius="md"
          />
          {monolith.horizons.map((horizon, index) => (
            <button
              key={horizon.id}
              type="button"
              onClick={() => setActiveHorizonId(horizon.id)}
              aria-label={horizon.label}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: `${bandHeight * index}%`,
                height: `${bandHeight}%`,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
            />
          ))}
        </div>

        {activeHorizon && (
          <SectionCard
            ref={panelRef}
            p="lg"
            w={280}
          >
            <Title
              order={3}
              mb="sm"
              c="charcoal.9"
            >{activeHorizon.label}
            </Title>
            <Stack gap="xs">
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
                  c="charcoal.7"
                >&bull; {characteristic.text}
                </Text>
              ))}
            </Stack>
          </SectionCard>
        )}
      </Group>
    </Stack>
  );
}

interface QuestionStepViewProps {
  question: Question;
  selectedOptionId: string | null;
  onSelect: (value: string) => void;
  revealed: boolean;
  error: string | null;
}

function QuestionStepView({
  question, selectedOptionId, onSelect, revealed, error
}: QuestionStepViewProps) {
  const selectedOption = question.options.find((option) => String(option.id) === selectedOptionId);
  const correctOption = question.options.find((option) => option.isCorrect);

  return (
    <Stack gap="md">
      <Text fw={600}>{question.prompt}</Text>
      <Radio.Group
        value={selectedOptionId}
        onChange={onSelect}
      >
        <Stack gap="sm">
          {question.options.map((option) => (
            <Radio.Card
              key={option.id}
              value={String(option.id)}
              radius="xl"
              p="md"
              style={{ pointerEvents: revealed ? 'none' : undefined }}
            >
              <Group>
                <Radio.Indicator />
                <Text>{option.text}</Text>
              </Group>
            </Radio.Card>
          ))}
        </Stack>
      </Radio.Group>
      {error && <Text c="red">{error}</Text>}
      {revealed && (
        <Text
          fw={600}
          c={selectedOption?.isCorrect ? 'moss.7' : 'red.7'}
        >
          {selectedOption?.isCorrect ? 'Correct.' : `Incorrect. The correct answer is: ${correctOption?.text}.`}
        </Text>
      )}
    </Stack>
  );
}

interface ChapterRunnerInnerProps {
  monolith: Monolith;
  nextMonolith: Monolith | undefined;
  initialStepIndex: number;
}

function ChapterRunnerInner({ monolith, nextMonolith, initialStepIndex }: ChapterRunnerInnerProps) {
  const navigate = useNavigate();
  const { markMonolithCompleted } = useContent();

  const steps = buildSteps(monolith);
  const [stepIndex, setStepIndex] = useState(initialStepIndex);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const awaitingSubmit = step.kind === 'question' && !revealed;

  // Timestamp the current question was first shown, used as the attempt's
  // startedAt so time-on-task reflects real elapsed time rather than the
  // near-zero gap between server-side startedAt/completedAt at submit-time.
  // Adjusts state during render (the React-endorsed pattern for deriving
  // state from a changed value) rather than in an effect, so it takes effect
  // in the same render instead of triggering an extra one.
  const [questionShownAt, setQuestionShownAt] = useState<string>(() => new Date().toISOString());
  const [shownAtStepIndex, setShownAtStepIndex] = useState(stepIndex);
  if (stepIndex !== shownAtStepIndex) {
    setShownAtStepIndex(stepIndex);
    if (step.kind === 'question') {
      setQuestionShownAt(new Date().toISOString());
    }
  }

  function goToStep(index: number) {
    setStepIndex(index);
    setSelectedOptionId(null);
    setRevealed(false);
    setError(null);
  }

  async function handleSubmit() {
    if (!selectedOptionId) {
      setError('Please select an answer.');
      return;
    }
    if (step.kind !== 'question') return;
    setError(null);
    setSubmitting(true);
    try {
      const session = await authApi.getSession();
      if (!session) throw new Error('Not authenticated');
      await userApi.submitAttempt(session.access_token, step.question.id, Number(selectedOptionId), questionShownAt);
      setRevealed(true);
    } catch (submitError) {
      console.error('Failed to submit attempt', submitError);
      setError('Failed to submit your answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    if (isLastStep) {
      markMonolithCompleted(monolith.id);
      navigate(nextMonolith ? `/tests/${nextMonolith.id}` : '/completed');
      return;
    }
    goToStep(stepIndex + 1);
  }

  function nextButtonLabel(): string {
    if (!isLastStep) {
      return 'Next';
    }
    return nextMonolith ? `Continue to Chapter ${nextMonolith.orderIndex}` : 'Finish';
  }

  return (
    <Stack
      maw={900}
      mx="auto"
      gap="lg"
    >
      <SectionCard p="xl">
        <Title
          order={1}
          mb="lg"
          c="charcoal.9"
        >
          Chapter {monolith.orderIndex}
        </Title>

        {step.kind === 'monolith' && <MonolithStepView monolith={monolith} />}
        {step.kind === 'question' && (
          <QuestionStepView
            question={step.question}
            selectedOptionId={selectedOptionId}
            onSelect={(value) => {
              setSelectedOptionId(value);
              setError(null);
            }}
            revealed={revealed}
            error={error}
          />
        )}
      </SectionCard>

      <Group justify="space-between">
        <Button
          variant="outline"
          color="terracotta.7"
          radius="xl"
          disabled={stepIndex === 0}
          onClick={() => goToStep(stepIndex - 1)}
          style={{ backgroundColor: 'var(--mantine-color-terracotta-1)' }}
        >
          Previous
        </Button>
        <Button
          color="terracotta"
          radius="xl"
          loading={awaitingSubmit && submitting}
          onClick={awaitingSubmit ? handleSubmit : handleNext}
        >
          {awaitingSubmit ? 'Submit Answer' : nextButtonLabel()}
        </Button>
      </Group>
    </Stack>
  );
}

function ChapterRunner() {
  const { monolithId } = useParams<{ monolithId: string; }>();
  const [searchParams] = useSearchParams();
  const { monoliths, loading } = useContent();

  if (loading) {
    return <Loader color="terracotta" />;
  }

  const monolith = monoliths.find((m) => String(m.id) === monolithId);

  if (!monolith) {
    return <Navigate to="/tests" replace />;
  }

  // ?step=N lets the Tests page deep-link straight to a specific question —
  // step 0 (the default) is always the monolith overview, steps 1..N are
  // monolith.questions in order. Clamped so a stale/hand-typed value can't
  // point past the end of this chapter.
  const lastStepIndex = monolith.questions.length;
  const requestedStep = Number(searchParams.get('step'));
  const initialStepIndex = Number.isFinite(requestedStep)
    ? Math.min(Math.max(requestedStep, 0), lastStepIndex)
    : 0;

  const nextMonolith = monoliths.find((m) => m.orderIndex === monolith.orderIndex + 1);

  return (
    <ChapterRunnerInner
      key={`${monolith.id}-${initialStepIndex}`}
      monolith={monolith}
      nextMonolith={nextMonolith}
      initialStepIndex={initialStepIndex}
    />
  );
}

export default ChapterRunner;
