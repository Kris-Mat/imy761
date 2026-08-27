import { Accordion, Loader, NavLink as MantineNavLink, Stack, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router';
import { useContent } from '../context/ContentContext';
import { Icon } from '@shared/ui/Icon';
import { categoryLabels } from '../lib/questionCategory';
import SectionCard from '../components/SectionCard';

function ChapterStatusIcon({ completed }: { completed: boolean; }) {
  if (completed) {
    return (
      <Icon
        name="CheckCircle"
        size={18}
        weight="fill"
        color="var(--mantine-color-terracotta-7)"
      />
    );
  }
  return (
    <Icon
      name="Circle"
      size={18}
      color="var(--mantine-color-gray-5)"
    />
  );
}

function Tests() {
  const navigate = useNavigate();
  const { monoliths, loading, completedMonolithIds } = useContent();

  return (
    <Stack maw={1100} mx="auto">
      <SectionCard p="xl">
        <Title
          order={1}
          mb="lg"
          c="charcoal.9"
        >Tests
        </Title>

        {loading && <Loader color="terracotta" />}

        <Accordion variant="separated" radius="md">
          {monoliths.map((monolith) => {
            const completed = completedMonolithIds.includes(monolith.id);
            return (
              <Accordion.Item key={monolith.id} value={String(monolith.id)}>
                <Accordion.Control>
                  <Text fw={700} c="charcoal.9">Chapter {monolith.orderIndex}</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Stack gap={4}>
                    <MantineNavLink
                      label={completed ? 'Revisit chapter' : 'Start chapter'}
                      onClick={() => navigate(`/tests/${monolith.id}`)}
                      leftSection={<ChapterStatusIcon completed={completed} />}
                      variant="subtle"
                    />
                    {monolith.questions.map((question, index) => (
                      <MantineNavLink
                        key={question.id}
                        label={categoryLabels[question.category]}
                        // Step 0 in ChapterRunner is always the monolith
                        // overview, so a question at position `index` in
                        // monolith.questions is step `index + 1`.
                        onClick={() => navigate(`/tests/${monolith.id}?step=${index + 1}`)}
                        leftSection={(
                          <Icon
                            name="Circle"
                            size={18}
                            color="var(--mantine-color-gray-5)"
                          />
                        )}
                        variant="subtle"
                      />
                    ))}
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            );
          })}
        </Accordion>
      </SectionCard>
    </Stack>
  );
}

export default Tests;
