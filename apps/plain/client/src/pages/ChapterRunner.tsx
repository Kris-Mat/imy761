import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  Button, Card, Group, Image, Loader, Radio, Stack, Table, Text, TextInput, Title
} from '@mantine/core';
import type { Horizon, Monolith, Question } from '@shared/api/models/monolith.model';
import { useContent } from '../context/ContentContext';
import MunsellChip from '../components/MunsellChip';

type Step =
  | { kind: 'monolith'; }
  | { kind: 'question'; question: Question; }
  | { kind: 'soilFamily'; };

function buildSteps(monolith: Monolith): Step[] {
  const [diagnostic, soilForm, landscape, suitability] = monolith.questions;
  return [
    { kind: 'monolith' },
    {
      kind: 'question', question: diagnostic 
    },
    {
      kind: 'question', question: soilForm 
    },
    { kind: 'soilFamily' },
    {
      kind: 'question', question: landscape 
    },
    {
      kind: 'question', question: suitability 
    }
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
      <Text fw={600}>Examine the soil monolith. Select each horizon to view its characteristics.</Text>
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
            alt={`${monolith.name} soil monolith`}
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
          <Card
            ref={panelRef}
            withBorder
            radius="lg"
            p="lg"
            w={280}
          >
            <Title order={3} mb="sm">{activeHorizon.label}</Title>
            <Stack gap="xs">
              <MunsellChip
                colourText={activeHorizon.colourText}
                hue={activeHorizon.colourHue}
                value={activeHorizon.colourValue}
                chroma={activeHorizon.colourChroma}
              />
              {activeHorizon.characteristics.map((characteristic) => (
                <Text key={characteristic.id} size="sm">&bull; {characteristic.text}</Text>
              ))}
            </Stack>
          </Card>
        )}
      </Group>
    </Stack>
  );
}

interface QuestionStepViewProps {
  question: Question;
  selectedOptionId: string | null;
  onSelect: (value: string) => void;
  error: string | null;
}

function QuestionStepView({ question, selectedOptionId, onSelect, error }: QuestionStepViewProps) {
  return (
    <Stack gap="md">
      <Text fw={600}>{question.prompt}</Text>
      <Radio.Group value={selectedOptionId} onChange={onSelect}>
        <Stack gap="sm">
          {question.options.map((option) => (
            <Radio.Card
              key={option.id}
              value={String(option.id)}
              radius="xl"
              p="md"
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
    </Stack>
  );
}

interface SoilFamilyStepViewProps {
  monolith: Monolith;
  values: Record<number, string>;
  onFieldChange: (fieldId: number, value: string) => void;
  finalCodeValue: string;
  onFinalCodeChange: (value: string) => void;
  error: string | null;
}

function SoilFamilyStepView({
  monolith, values, onFieldChange, finalCodeValue, onFinalCodeChange, error
}: SoilFamilyStepViewProps) {
  if (!monolith.soilFamilyCode) {
    return <Text c="dimmed">TODO: soil family code content missing for this chapter.</Text>;
  }

  return (
    <Stack gap="md">
      <Text fw={600}>Use the Soil Family Table to determine the soil family. Complete the Soil Family Code.</Text>
      <Table withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Characteristic</Table.Th>
            <Table.Th>Your Answer</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {monolith.soilFamilyCode.fields.map((field) => (
            <Table.Tr key={field.id}>
              <Table.Td>{field.label}</Table.Td>
              <Table.Td>
                <TextInput
                  value={values[field.id] ?? ''}
                  onChange={(event) => onFieldChange(field.id, event.currentTarget.value)}
                  w={80}
                />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <Group>
        <Text fw={600}>Final Soil Family Code</Text>
        <TextInput
          value={finalCodeValue}
          onChange={(event) => onFinalCodeChange(event.currentTarget.value)}
          w={140}
        />
      </Group>
      {error && <Text c="red">{error}</Text>}
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
  const [mcqError, setMcqError] = useState<string | null>(null);
  const [familyValues, setFamilyValues] = useState<Record<number, string>>({});
  const [finalCodeValue, setFinalCodeValue] = useState('');
  const [familyError, setFamilyError] = useState<string | null>(null);

  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  function goToStep(index: number) {
    setStepIndex(index);
    setSelectedOptionId(null);
    setMcqError(null);
    setFamilyError(null);
  }

  function handleNext() {
    if (step.kind === 'question') {
      const correctOption = step.question.options.find((option) => option.isCorrect);
      if (!selectedOptionId || String(correctOption?.id) !== selectedOptionId) {
        setMcqError('Incorrect. Please review your answer.');
        return;
      }
      setMcqError(null);
    }

    if (step.kind === 'soilFamily' && monolith.soilFamilyCode) {
      const allFieldsCorrect = monolith.soilFamilyCode.fields.every(
        (field) => (familyValues[field.id] ?? '').trim() === field.correctValue
      );
      const codeCorrect = finalCodeValue.trim() === monolith.soilFamilyCode.finalCode;
      if (!allFieldsCorrect || !codeCorrect) {
        setFamilyError('Some answers are incorrect. Please review your responses.');
        return;
      }
      setFamilyError(null);
    }

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
    return nextMonolith ? `Continue to ${nextMonolith.name}` : 'Finish';
  }

  return (
    <Stack
      maw={900}
      mx="auto"
      gap="lg"
    >
      <Title order={1}>
        Chapter {monolith.orderIndex}:{' '}
        <Text
          span
          fw={700}
          inherit
        >
          {monolith.name} Soil
        </Text>
      </Title>

      <Card
        withBorder
        radius="lg"
        p="xl"
      >
        {step.kind === 'monolith' && <MonolithStepView monolith={monolith} />}
        {step.kind === 'question' && (
          <QuestionStepView
            question={step.question}
            selectedOptionId={selectedOptionId}
            onSelect={(value) => {
              setSelectedOptionId(value);
              setMcqError(null);
            }}
            error={mcqError}
          />
        )}
        {step.kind === 'soilFamily' && (
          <SoilFamilyStepView
            monolith={monolith}
            values={familyValues}
            onFieldChange={(fieldId, value) => setFamilyValues((prev) => ({
              ...prev, [fieldId]: value 
            }))}
            finalCodeValue={finalCodeValue}
            onFinalCodeChange={setFinalCodeValue}
            error={familyError}
          />
        )}
      </Card>

      <Group justify="space-between">
        <Button
          variant="outline"
          color="soil"
          radius="xl"
          disabled={stepIndex === 0}
          onClick={() => goToStep(stepIndex - 1)}
        >
          Previous
        </Button>
        <Button
          color="soil"
          radius="xl"
          onClick={handleNext}
        >
          {nextButtonLabel()}
        </Button>
      </Group>
    </Stack>
  );
}

function ChapterRunner() {
  const { monolithId } = useParams<{ monolithId: string; }>();
  const { monoliths, loading } = useContent();

  if (loading) {
    return <Loader color="soil" />;
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
