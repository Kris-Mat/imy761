import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Accordion, Avatar, Badge, Box, Group, Loader, Stack, Text, Title, UnstyledButton
} from '@mantine/core';
import { Icon, type IconName } from '@shared/ui/Icon';
import { useUser } from '../context/UserContext';
import { useMonoliths } from '../hooks/useMonoliths';
import { categoryLabels } from '../lib/questionCategory';
import { hasAttempted, hasFinished } from '../lib/questProgress';
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

type QuestionStatus = 'unanswered' | 'correct' | 'incorrect';

function QuestionStatusIcon({ status }: { status: QuestionStatus; }) {
  if (status === 'correct') {
    return (
      <Icon
        name="CheckCircle"
        size={18}
        weight="fill"
        color="var(--mantine-color-moss-7)"
      />
    );
  }
  if (status === 'incorrect') {
    return (
      <Icon
        name="XCircle"
        size={18}
        weight="fill"
        color="var(--mantine-color-red-6)"
      />
    );
  }
  return (
    <Icon
      name="Circle"
      size={18}
      color="var(--mantine-color-charcoal-4)"
    />
  );
}

// One tappable line in a quest's dropdown. Shared by the section entries
// (Overview / Soil Profile / Summary) and the individual questions between them,
// so they all read as a single list.
function QuestRow({ icon, label, onClick }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <UnstyledButton
      onClick={onClick}
      py={8}
      px="xs"
      style={{
        borderRadius: 'var(--mantine-radius-sm)', cursor: 'pointer'
      }}
    >
      <Group gap="sm">
        {icon}
        <Text c="charcoal.8">{label}</Text>
      </Group>
    </UnstyledButton>
  );
}

function SectionIcon({ name }: { name: IconName; }) {
  return (
    <Icon
      name={name}
      size={18}
      color="var(--mantine-color-terracotta-6)"
    />
  );
}

function Quests() {
  const navigate = useNavigate();
  const { farms, loading: userLoading } = useUser();
  const { monoliths, loading: monolithsLoading } = useMonoliths();

  const sortedFarms = useMemo(
    () => [...(farms ?? [])].sort((a, b) => a.orderIndex - b.orderIndex),
    [farms]
  );

  const loading = userLoading || monolithsLoading;

  return (
    <Box
      px="xl"
      pt={140}
      pb={80}
      maw={900}
      mx="auto"
    >
      <Title
        order={1}
        mb="lg"
        c="charcoal.9"
      >
        My Quests
      </Title>

      {loading && <Loader color="terracotta" />}

      {!loading && (
        <Accordion
          variant="separated"
          radius="md"
          chevronPosition="left"
        >
          {sortedFarms.map((farm) => {
            // Levels and monoliths are seeded 1:1 by orderIndex/levelNumber
            // (see prisma/seed.ts) — FarmProgress carries no monolith id, so
            // this is the only join available on the client.
            const monolith = monoliths.find((m) => m.orderIndex === farm.orderIndex);
            const attempted = hasAttempted(farm);
            const finished = hasFinished(farm);

            return (
              <Accordion.Item
                key={farm.id}
                value={String(farm.id)}
              >
                <Accordion.Control>
                  <Group>
                    <Avatar
                      src={farmerImages[farm.orderIndex]}
                      alt={farm.farmerName}
                      size={40}
                      radius="50%"
                      imageProps={{ style: {
                        objectFit: 'cover', objectPosition: '50% 15%'
                      } }}
                    />
                    <Text
                      fw={700}
                      c="charcoal.9"
                    >
                      Quest {farm.orderIndex}: {farm.farmerName}
                    </Text>
                    {farm.scorePercent !== null && (
                      <Badge
                        color={farm.scorePercent >= 75 ? 'moss' : 'terracotta'}
                        variant="light"
                        ml="auto"
                      >
                        {farm.scorePercent}%
                      </Badge>
                    )}
                  </Group>
                </Accordion.Control>
                <Accordion.Panel>
                  {!monolith && (
                    <Text
                      c="charcoal.5"
                      fz="sm"
                    >
                      Content for this quest is coming soon.
                    </Text>
                  )}
                  {monolith && (
                    <Stack gap={4}>
                      <QuestRow
                        icon={<SectionIcon name="ChatCircleDots" />}
                        label="Overview"
                        onClick={() => navigate(`/quests/${farm.id}/0`)}
                      />
                      <QuestRow
                        icon={<SectionIcon name="Stack" />}
                        label="Soil Profile"
                        onClick={() => navigate(`/quests/${farm.id}/0?phase=explore`)}
                      />
                      {monolith.questions.map((question, index) => {
                        const questionProgress = farm.questions.find((entry) => entry.questionId === question.id);
                        const status: QuestionStatus = questionProgress?.isCorrect === null || questionProgress === undefined
                          ? 'unanswered'
                          : (questionProgress.isCorrect ? 'correct' : 'incorrect');

                        // Once a quest has been attempted, these rows are a way
                        // back into that answer in review mode. Before then
                        // there's nothing to review, so they just open the quest
                        // at its overview.
                        const target = attempted
                          ? `/quests/${farm.id}/${index}?mode=review`
                          : `/quests/${farm.id}/0`;

                        return (
                          <QuestRow
                            key={question.id}
                            icon={<QuestionStatusIcon status={status} />}
                            label={categoryLabels[question.category]}
                            onClick={() => navigate(target)}
                          />
                        );
                      })}
                      {/* The farmer's closing review is only meaningful once
                          there's a finished pass behind it — before that it
                          would report 0% on a quest nobody has played. */}
                      {finished && (
                        <QuestRow
                          icon={<SectionIcon name="Trophy" />}
                          label="Summary"
                          onClick={() => navigate(`/quests/${farm.id}/${monolith.questions.length}`)}
                        />
                      )}
                    </Stack>
                  )}
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      )}
    </Box>
  );
}

export default Quests;
