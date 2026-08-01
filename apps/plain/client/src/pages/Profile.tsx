import { Avatar, Button, Card, Group, List, Stack, Text, Title } from '@mantine/core';
import { Icon } from '@shared/ui/Icon';
import { useContent } from '../context/ContentContext';

const currentUser = {
  firstName: 'Jane',
  lastName: 'Doe',
  studentNumber: 'u12345678',
  role: 'Soil Science Student',
  email: 'u12345678@tuks.co.za',
  mentorName: 'Prof. Janette Briggs'
};

// Static placeholders, not DB-backed — not confirmed in scope. See HANDOFF.md.
const mentorInfo = {
  mentorComment: 'You are doing great Jane, I am seeing good progress in your marks!',
  academicGoals: ['Study 6 days a week', 'Complete all three chapters', 'Review the Soil Family Table']
};

function Profile() {
  const { monoliths, completedMonolithIds } = useContent();

  return (
    <Stack maw={1100} mx="auto">
      <Title order={1} mb="lg">
        My{' '}
        <Text
          span
          fw={700}
          inherit
        >Profile
        </Text>
      </Title>

      <Group
        align="flex-start"
        gap={40}
        wrap="wrap"
      >
        <Stack w={260} gap={4}>
          <Avatar
            size={60}
            color="soil"
            radius="xl"
            mb="sm"
          >
            <Icon
              name="User"
              size={32}
              weight="fill"
            />
          </Avatar>
          <Text fw={700} fz="lg">{currentUser.firstName} {currentUser.lastName}</Text>
          <Text c="dimmed" fz="sm">{currentUser.studentNumber}</Text>
          <Text c="dimmed" fz="sm">{currentUser.role}</Text>

          <Stack gap={2} mt="md">
            <Text fw={700} fz="sm">Email</Text>
            <Text fz="sm">{currentUser.email}</Text>
          </Stack>
          <Stack gap={2} mt="md">
            <Text fw={700} fz="sm">Password</Text>
            <Text fz="sm">&bull;&bull;&bull;&bull;&bull;&bull;&bull;</Text>
          </Stack>
          <Stack gap={2} mt="md">
            <Text fw={700} fz="sm">Mentor</Text>
            <Text fz="sm">{currentUser.mentorName}</Text>
          </Stack>
        </Stack>

        <Stack
          style={{ flex: 1 }}
          miw={320}
          gap="xl"
        >
          <Card
            withBorder
            radius="lg"
            p="xl"
          >
            <Title order={2} mb="md">Learning Dashboard</Title>
            <Group justify="space-between">
              <Text fw={600}>Chapters completed</Text>
              <Text c="dimmed">{completedMonolithIds.length} / {monoliths.length}</Text>
            </Group>
            <Text
              fw={700}
              fz="sm"
              mt="md"
            >Comments from mentor:
            </Text>
            <Text fs="italic">&ldquo;{mentorInfo.mentorComment}&rdquo;</Text>
          </Card>

          <Card
            withBorder
            radius="lg"
            p="xl"
          >
            <Title order={2} mb="md">My Academic Goals</Title>
            <List spacing="xs" mb="md">
              {mentorInfo.academicGoals.map((goal) => (
                <List.Item key={goal}>{goal}</List.Item>
              ))}
            </List>
            <Button
              variant="light"
              color="soil"
              radius="xl"
              w="fit-content"
            >+ edit goals
            </Button>
          </Card>
        </Stack>
      </Group>
    </Stack>
  );
}

export default Profile;
