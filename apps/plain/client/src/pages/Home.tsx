import { Title, Text, Flex, Divider, Stack, Group, Button, Loader } from '@mantine/core';
import { Link } from 'react-router';
import { useContent } from '../context/ContentContext';
import SectionCard from '../components/SectionCard';

const currentUserName = 'Jane Doe';

function Home() {
  const { monoliths, loading, completedMonolithIds } = useContent();

  const nextMonolith = monoliths.find((m) => !completedMonolithIds.includes(m.id));
  const lastCompletedMonolith = [...monoliths].reverse().find((m) => completedMonolithIds.includes(m.id));

  return (
    <Stack
      maw={1100}
      mx="auto"
    >
      <SectionCard p="xl">
        <Stack gap="xl">
          <Title
            order={1}
            c="charcoal.9"
          >
            Welcome back,{' '}
            <Text
              span
              fw={700}
              inherit
            >{currentUserName}!
            </Text>
          </Title>

          {loading && <Loader color="terracotta" />}

          <Divider />

          <Flex
            align="stretch"
            gap="xl"
            wrap="wrap"
          >
            <Stack
              style={{ flex: 1 }}
              miw={240}
              gap="sm"
            >
              <Title
                order={2}
                mb="md"
                c="charcoal.9"
              >My Progress
              </Title>
              <Stack gap="sm">
                {monoliths.map((monolith) => (
                  <Group key={monolith.id} justify="space-between">
                    <Text fw={600} c="charcoal.8">Chapter {monolith.orderIndex}</Text>
                    <Text c="charcoal.6">{completedMonolithIds.includes(monolith.id) ? 'Completed' : 'Not started'}</Text>
                  </Group>
                ))}
              </Stack>
            </Stack>

            <Divider orientation="vertical" />

            <Stack
              style={{ flex: 1 }}
              miw={240}
              gap="sm"
            >
              <Title
                order={2}
                mb="md"
                c="charcoal.9"
              >Statistics
              </Title>
              <Group justify="space-between">
                <Text fw={600} c="charcoal.8">Chapters completed</Text>
                <Text c="charcoal.6">{completedMonolithIds.length} / {monoliths.length}</Text>
              </Group>
            </Stack>
          </Flex>

          <Divider />

          <Stack gap="sm">
            <Title
              order={2}
              mb="md"
              c="charcoal.9"
            >Pick up where you left off...
            </Title>

            {lastCompletedMonolith && (
              <Group justify="space-between" py="sm">
                <div>
                  <Text fw={700} c="charcoal.8">Last completed:</Text>
                  <Text c="charcoal.7">Chapter {lastCompletedMonolith.orderIndex}</Text>
                </div>
              </Group>
            )}

            {nextMonolith
              ? (
                <Group justify="space-between" py="sm">
                  <div>
                    <Text fw={700} c="charcoal.8">Next up:</Text>
                    <Text c="charcoal.7">Chapter {nextMonolith.orderIndex}</Text>
                  </div>
                  <Button
                    component={Link}
                    to={`/tests/${nextMonolith.id}`}
                    color="terracotta"
                    radius="xl"
                  >
                    {completedMonolithIds.length > 0 ? 'Continue' : 'Start'}
                  </Button>
                </Group>
              )
              : <Text c="charcoal.6">All chapters completed — nice work!</Text>}
          </Stack>
        </Stack>
      </SectionCard>
    </Stack>
  );
}

export default Home;
