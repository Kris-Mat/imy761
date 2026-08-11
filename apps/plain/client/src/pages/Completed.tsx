import { Button, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router';
import SectionCard from '../components/SectionCard';

function Completed() {
  return (
    <Stack maw={700} mx="auto">
      <SectionCard p="xl">
        <Stack
          align="center"
          gap="lg"
          py="xl"
        >
          <Title
            order={1}
            ta="center"
            c="charcoal.9"
          >All chapters completed
          </Title>
          <Text c="charcoal.6" ta="center">
            You have worked through all three chapters. Well done!
          </Text>
          <Button
            component={Link}
            to="/tests"
            color="terracotta"
            radius="xl"
          >Back to Tests
          </Button>
        </Stack>
      </SectionCard>
    </Stack>
  );
}

export default Completed;
