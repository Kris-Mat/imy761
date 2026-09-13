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

function MonolithStepView({ monolith, revealedQuestionIds }: {
  monolith: Monolith;
  // Question ids the user has actually revealed (submitted) this chapter
  // visit — used to keep this overview panel from handing over the answer
  // to a still-unanswered horizon-colour question via "Previous" (see
  // ChapterRunnerInner, which never resets this across navigation).
  revealedQuestionIds: Set<number>;
}) {
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

  // A horizon can have both a colour question and a characteristic
  // question linked to it, so which is which has to be told apart: a
  // characteristic question's options are drawn from real characteristics
  // text (its own or another horizon's), which a colour question's
  // "value/chroma" options never are. Undefined when a horizon has no
  // linked question of that kind at all (e.g. Rensburg has no colour
  // question), in which case there's nothing to hide for it.
  const linkedQuestions = activeHorizon
    ? monolith.questions.filter((question) => question.horizonId === activeHorizon.id)
    : [];
  const linkedCharacteristicQuestion = linkedQuestions.find((question) => question.options.some(
    (option) => activeHorizon!.characteristics.some((characteristic) => characteristic.text === option.text)
  ));
  const linkedColourQuestion = linkedQuestions.find((question) => question !== linkedCharacteristicQuestion);

  const revealActiveHorizonColour = !linkedColourQuestion || revealedQuestionIds.has(linkedColourQuestion.id);
  const revealActiveHorizonCharacteristics = !linkedCharacteristicQuestion
    || revealedQuestionIds.has(linkedCharacteristicQuestion.id);

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
                revealLabel={revealActiveHorizonColour}
              />
              {revealActiveHorizonCharacteristics && activeHorizon.characteristics.map((characteristic) => (
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
  monolith: Monolith;
  question: Question;
  selectedOptionId: string | null;
  onSelect: (value: string) => void;
  revealed: boolean;
  // Whether this exact question has been revealed at any point during this
  // chapter visit — unlike `revealed`, this doesn't reset when navigating
  // away and back via Previous/Next, so the swatch doesn't hide an answer
  // the user already saw.
  everRevealed: boolean;
  error: string | null;
}

function QuestionStepView({
  monolith, question, selectedOptionId, onSelect, revealed, everRevealed, error
}: QuestionStepViewProps) {
  const selectedOption = question.options.find((option) => String(option.id) === selectedOptionId);
  const correctOption = question.options.find((option) => option.isCorrect);
  // Only set for a horizon-linked question (Question.horizonId) — undefined
  // for every other question type.
  const linkedHorizon = question.horizonId != null
    ? monolith.horizons.find((horizon) => horizon.id === question.horizonId)
    : undefined;
  // A horizon can have both a colour and a characteristic question — the
  // swatch below is only relevant to the colour one. See the same
  // options-vs-characteristics-text check in MonolithStepView.
  const isCharacteristicQuestion = !!linkedHorizon && question.options.some(
    (option) => linkedHorizon.characteristics.some((characteristic) => characteristic.text === option.text)
  );

  return (
    <Stack gap="md">
      <Text fw={600}>{question.prompt}</Text>
      {linkedHorizon && !isCharacteristicQuestion && (
        <SectionCard p="md">
          <Stack gap={6}>
            <Text
              fz="xs"
              fw={600}
              c="charcoal.6"
            >
              This horizon&rsquo;s colour
            </Text>
            <MunsellChip
              colourText={linkedHorizon.colourText}
              hue={linkedHorizon.colourHue}
              value={linkedHorizon.colourValue}
              chroma={linkedHorizon.colourChroma}
              revealLabel={revealed || everRevealed}
            />
          </Stack>
        </SectionCard>
      )}
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
  const { markMonolithCompleted, refreshQuestionResults } = useContent();

  const steps = buildSteps(monolith);
  const [stepIndex, setStepIndex] = useState(initialStepIndex);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Accumulates across the whole chapter visit (never reset by goToStep, only
  // by this component remounting for a different chapter) — see
  // MonolithStepView, which needs to know this even when the user has
  // navigated away from the question step itself via Previous/Next.
  const [revealedQuestionIds, setRevealedQuestionIds] = useState<Set<number>>(new Set());

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
      setRevealedQuestionIds((prev) => new Set(prev).add(step.question.id));
      refreshQuestionResults();
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

        {step.kind === 'monolith' && (
          <MonolithStepView
            monolith={monolith}
            revealedQuestionIds={revealedQuestionIds}
          />
        )}
        {step.kind === 'question' && (
          <QuestionStepView
            monolith={monolith}
            question={step.question}
            selectedOptionId={selectedOptionId}
            onSelect={(value) => {
              setSelectedOptionId(value);
              setError(null);
            }}
            revealed={revealed}
            everRevealed={revealedQuestionIds.has(step.question.id)}
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
