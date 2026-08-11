import { Avatar, Button, Divider, Flex, Group, List, Stack, Text, Title } from '@mantine/core';
import { Icon } from '@shared/ui/Icon';
import { useContent } from '../context/ContentContext';
import SectionCard from '../components/SectionCard';

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
      <SectionCard p="xl">
        <Title
          order={1}
          mb="lg"
          c="charcoal.9"
        >
          My{' '}
          <Text
            span
            fw={700}
            inherit
          >Profile
          </Text>
        </Title>

        <Flex
          align="stretch"
          gap={40}
          wrap="wrap"
        >
          <Stack
            w={260}
            gap={4}
            pr="xl"
            style={{ borderRight: '1px solid var(--mantine-color-charcoal-2)' }}
          >
            <Avatar
              size={60}
              color="terracotta"
              radius="xl"
              mb="sm"
            >
              <Icon
                name="User"
                size={32}
                weight="fill"
              />
            </Avatar>
            <Text
              fw={700}
              fz="lg"
              c="charcoal.9"
            >{currentUser.firstName} {currentUser.lastName}
            </Text>
            <Text c="charcoal.6" fz="sm">{currentUser.studentNumber}</Text>
            <Text c="charcoal.6" fz="sm">{currentUser.role}</Text>

            <Stack gap={2} mt="md">
              <Text
                fw={700}
                fz="sm"
                c="charcoal.8"
              >Email
              </Text>
              <Text fz="sm" c="charcoal.7">{currentUser.email}</Text>
            </Stack>
            <Stack gap={2} mt="md">
              <Text
                fw={700}
                fz="sm"
                c="charcoal.8"
              >Password
              </Text>
              <Text fz="sm" c="charcoal.7">&bull;&bull;&bull;&bull;&bull;&bull;&bull;</Text>
            </Stack>
            <Stack gap={2} mt="md">
              <Text
                fw={700}
                fz="sm"
                c="charcoal.8"
              >Mentor
              </Text>
              <Text fz="sm" c="charcoal.7">{currentUser.mentorName}</Text>
            </Stack>
          </Stack>

          <Stack
            style={{ flex: 1 }}
            miw={320}
            gap="xl"
          >
            <Stack gap="sm">
              <Text
                fz="xl"
                fw={700}
                c="charcoal.9"
              >Learning Dashboard
              </Text>
              <Group justify="space-between">
                <Text fw={600} c="charcoal.8">Chapters completed</Text>
                <Text c="charcoal.6">{completedMonolithIds.length} / {monoliths.length}</Text>
              </Group>
              <Text
                fw={700}
                fz="sm"
                mt="md"
                c="charcoal.8"
              >Comments from mentor:
              </Text>
              <Text fs="italic" c="charcoal.7">&ldquo;{mentorInfo.mentorComment}&rdquo;</Text>
            </Stack>

            <Divider />

            <Stack gap="sm">
              <Text
                fz="xl"
                fw={700}
                c="charcoal.9"
              >My Academic Goals
              </Text>
              <List spacing="xs">
                {mentorInfo.academicGoals.map((goal) => (
                  <List.Item key={goal}>{goal}</List.Item>
                ))}
              </List>
              <Button
                variant="light"
                color="terracotta"
                radius="xl"
                w="fit-content"
              >+ edit goals
              </Button>
            </Stack>
          </Stack>
        </Flex>
      </SectionCard>
    </Stack>
  );
}

export default Profile;
