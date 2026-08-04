import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Accordion, Avatar, Badge, Box, Group, Loader, Stack, Text, Title, UnstyledButton
} from '@mantine/core';
import { Icon } from '@shared/ui/Icon';
import { useUser } from '../context/UserContext';
import { useMonoliths } from '../hooks/useMonoliths';
import { useQuestProgress } from '../hooks/useQuestProgress';
import { categoryLabels } from '../lib/questionCategory';
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

function Quests() {
  const navigate = useNavigate();
  const { user, farms, loading: userLoading } = useUser();
  const { monoliths, loading: monolithsLoading } = useMonoliths();
  const { progress } = useQuestProgress(user?.supabaseId);

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
            const farmProgress = progress[farm.id];

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
                    {farm.completed && (
                      <Badge
                        color="moss"
                        variant="light"
                        ml="auto"
                      >
                        Completed
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
                      {monolith.questions.map((question, index) => {
                        const pickedOptionId = farmProgress?.[index];
                        const status: QuestionStatus = pickedOptionId === undefined
                          ? (farm.completed ? 'correct' : 'unanswered')
                          : (question.options.find((option) => option.isCorrect)?.id === pickedOptionId ? 'correct' : 'incorrect');

                        return (
                          <UnstyledButton
                            key={question.id}
                            onClick={() => navigate(`/quests/${farm.id}/${index}`)}
                            py={8}
                            px="xs"
                            style={{ borderRadius: 'var(--mantine-radius-sm)' }}
                          >
                            <Group gap="sm">
                              <QuestionStatusIcon status={status} />
                              <Text c="charcoal.8">{categoryLabels[question.category]}</Text>
                            </Group>
                          </UnstyledButton>
                        );
                      })}
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
