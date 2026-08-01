import { Accordion, Loader, NavLink as MantineNavLink, Stack, Text, Title } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { useContent } from '../context/ContentContext';
import { Icon } from '@shared/ui/Icon';

function ChapterStatusIcon({ completed }: { completed: boolean; }) {
  if (completed) {
    return (
      <Icon
        name="CheckCircle"
        size={18}
        weight="fill"
        color="var(--mantine-color-soil-8)"
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
      <Title order={1} mb="lg">Tests</Title>

      {loading && <Loader color="soil" />}

      <Accordion variant="separated" radius="md">
        {monoliths.map((monolith) => {
          const completed = completedMonolithIds.includes(monolith.id);
          return (
            <Accordion.Item key={monolith.id} value={String(monolith.id)}>
              <Accordion.Control>
                <Text fw={700}>Chapter {monolith.orderIndex}: {monolith.name} Soil</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <MantineNavLink
                  label={completed ? 'Revisit chapter' : 'Start chapter'}
                  onClick={() => navigate(`/tests/${monolith.id}`)}
                  leftSection={<ChapterStatusIcon completed={completed} />}
                  variant="subtle"
                />
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
    </Stack>
  );
}

export default Tests;
