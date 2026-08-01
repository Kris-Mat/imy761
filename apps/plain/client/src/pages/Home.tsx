import { Title, Text, Card, SimpleGrid, Stack, Group, Button, Loader } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useContent } from '../context/ContentContext';

const currentUserName = 'Jane Doe';

function Home() {
  const { monoliths, loading, completedMonolithIds } = useContent();

  const nextMonolith = monoliths.find((m) => !completedMonolithIds.includes(m.id));
  const lastCompletedMonolith = [...monoliths].reverse().find((m) => completedMonolithIds.includes(m.id));

  return (
    <Stack
      gap="xl"
      maw={1100}
      mx="auto"
    >
      <Title order={1}>
        Welcome back,{' '}
        <Text
          span
          fw={700}
          inherit
        >{currentUserName}!
        </Text>
      </Title>

      {loading && <Loader color="soil" />}

      <SimpleGrid
        cols={{
          base: 1, sm: 2 
        }}
        spacing="xl"
      >
        <Card
          withBorder
          radius="lg"
          p="xl"
        >
          <Title order={2} mb="md">My Progress</Title>
          <Stack gap="sm">
            {monoliths.map((monolith) => (
              <Group key={monolith.id} justify="space-between">
                <Text fw={600}>Chapter {monolith.orderIndex}: {monolith.name} Soil</Text>
                <Text c="dimmed">{completedMonolithIds.includes(monolith.id) ? 'Completed' : 'Not started'}</Text>
              </Group>
            ))}
          </Stack>
        </Card>

        <Card
          withBorder
          radius="lg"
          p="xl"
        >
          <Title order={2} mb="md">Statistics</Title>
          <Group justify="space-between">
            <Text fw={600}>Chapters completed</Text>
            <Text c="dimmed">{completedMonolithIds.length} / {monoliths.length}</Text>
          </Group>
        </Card>
      </SimpleGrid>

      <Card
        withBorder
        radius="lg"
        p="xl"
      >
        <Title order={2} mb="md">Pick up where you left off...</Title>

        {lastCompletedMonolith && (
          <Group justify="space-between" py="sm">
            <div>
              <Text fw={700}>Last completed:</Text>
              <Text>Chapter {lastCompletedMonolith.orderIndex}: {lastCompletedMonolith.name} Soil</Text>
            </div>
          </Group>
        )}

        {nextMonolith
          ? (
            <Group justify="space-between" py="sm">
              <div>
                <Text fw={700}>Next up:</Text>
                <Text>Chapter {nextMonolith.orderIndex}: {nextMonolith.name} Soil</Text>
              </div>
              <Button
                component={Link}
                to={`/tests/${nextMonolith.id}`}
                color="soil"
                radius="xl"
              >
                {completedMonolithIds.length > 0 ? 'Continue' : 'Start'}
              </Button>
            </Group>
          )
          : <Text c="dimmed">All chapters completed — nice work!</Text>}
      </Card>
    </Stack>
  );
}

export default Home;
