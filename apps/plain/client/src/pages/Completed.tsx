import { Button, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';

function Completed() {
  return (
    <Stack
      maw={700}
      mx="auto"
      align="center"
      gap="lg"
      py="xl"
    >
      <Title order={1} ta="center">All chapters completed</Title>
      <Text c="dimmed" ta="center">
        You have worked through Hutton, Avalon, and Rensburg. Well done!
      </Text>
      <Button
        component={Link}
        to="/tests"
        color="soil"
        radius="xl"
      >Back to Tests
      </Button>
    </Stack>
  );
}

export default Completed;
