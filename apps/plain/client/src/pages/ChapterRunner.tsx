import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import {
  Button, Group, Image, Loader, Radio, Stack, Text, Title
} from '@mantine/core';
import type { Horizon, Monolith, Question } from '@shared/api/models/monolith.model';
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
}

function ChapterRunnerInner({ monolith, nextMonolith }: ChapterRunnerInnerProps) {
  const navigate = useNavigate();
  const { markMonolithCompleted } = useContent();

  const steps = buildSteps(monolith);
  const [stepIndex, setStepIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;
  const awaitingSubmit = step.kind === 'question' && !revealed;

  function goToStep(index: number) {
    setStepIndex(index);
    setSelectedOptionId(null);
    setRevealed(false);
    setError(null);
  }

  function handleSubmit() {
    if (!selectedOptionId) {
      setError('Please select an answer.');
      return;
    }
    setError(null);
    setRevealed(true);
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
  const { monoliths, loading } = useContent();

  if (loading) {
    return <Loader color="terracotta" />;
  }

  const monolith = monoliths.find((m) => String(m.id) === monolithId);

  if (!monolith) {
    return <Navigate to="/tests" replace />;
  }

  const nextMonolith = monoliths.find((m) => m.orderIndex === monolith.orderIndex + 1);

  return (
    <ChapterRunnerInner
      key={monolith.id}
      monolith={monolith}
      nextMonolith={nextMonolith}
    />
  );
}

export default ChapterRunner;
