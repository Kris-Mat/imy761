import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Avatar, Button, Divider, Flex, Group, Loader, Stack, Text, TextInput, Title
} from '@mantine/core';
import { Icon } from '@shared/ui/Icon';
import type { User } from '@shared/api/models/user.model';
import { authApi } from '@shared/api/services/auth.api';
import { userApi } from '@shared/api/services/users.api';
import { useContent } from '../context/ContentContext';
import SectionCard from '../components/SectionCard';

// Fields with no backing data model anywhere (User has no student-number,
// course-role, or mentor concept) — left as the static placeholders they
// already were, not wired to editing since there's nothing real to save.
// See HANDOFF.md.
const STATIC_PROFILE_INFO = {
  role: 'Soil Science Student',
  mentorName: 'Prof. Janette Briggs'
};

interface DetailsForm {
  username: string;
  firstName: string;
  lastName: string;
}

function Profile() {
  const { monoliths, completedMonolithIds } = useContent();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await authApi.getSession();
        if (!session) throw new Error('Not authenticated');
        const synced = await userApi.syncUser(session.access_token);
        if (!cancelled) setUser(synced);
      } catch (error) {
        console.error('Failed to load user', error);
        if (!cancelled) setUserError('Failed to load your profile. Please refresh the page.');
      } finally {
        if (!cancelled) setUserLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const [editing, setEditing] = useState(false);
  const [draftDetails, setDraftDetails] = useState<DetailsForm>({
    username: '', firstName: '', lastName: ''
  });
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  function startEditing() {
    if (!user) return;
    setDraftDetails({
      username: user.username, firstName: user.firstName, lastName: user.lastName
    });
    setDetailsError(null);
    setEditing(true);
  }

  async function handleSaveDetails() {
    if (!draftDetails.username.trim() || !draftDetails.firstName.trim() || !draftDetails.lastName.trim()) {
      setDetailsError('Username, first name and last name are all required.');
      return;
    }
    setSavingDetails(true);
    setDetailsError(null);
    try {
      const session = await authApi.getSession();
      if (!session) throw new Error('Not authenticated');
      const saved = await userApi.saveMyDetails(session.access_token, {
        username: draftDetails.username.trim(),
        firstName: draftDetails.firstName.trim(),
        lastName: draftDetails.lastName.trim()
      });
      setUser(saved);
      setEditing(false);
    } catch (error) {
      console.error('Failed to save details', error);
      setDetailsError('Failed to save your changes. Please try again.');
    } finally {
      setSavingDetails(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await authApi.logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Failed to log out', error);
      setLoggingOut(false);
    }
  }

  const sortedMonoliths = [...monoliths].sort((a, b) => a.orderIndex - b.orderIndex);

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

            {userLoading ? (
              <Loader
                color="terracotta"
                size="sm"
              />
            ) : editing ? (
              <Stack gap="sm">
                <TextInput
                  label="Username"
                  size="xs"
                  value={draftDetails.username}
                  onChange={(event) => setDraftDetails((prev) => ({
                    ...prev, username: event.currentTarget.value
                  }))}
                />
                <TextInput
                  label="First name"
                  size="xs"
                  value={draftDetails.firstName}
                  onChange={(event) => setDraftDetails((prev) => ({
                    ...prev, firstName: event.currentTarget.value
                  }))}
                />
                <TextInput
                  label="Last name"
                  size="xs"
                  value={draftDetails.lastName}
                  onChange={(event) => setDraftDetails((prev) => ({
                    ...prev, lastName: event.currentTarget.value
                  }))}
                />
                {detailsError && (
                  <Text
                    fz="xs"
                    c="red.7"
                  >
                    {detailsError}
                  </Text>
                )}
                <Group gap="xs">
                  <Button
                    size="xs"
                    variant="default"
                    disabled={savingDetails}
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="xs"
                    color="terracotta"
                    loading={savingDetails}
                    onClick={handleSaveDetails}
                  >
                    Save
                  </Button>
                </Group>
              </Stack>
            ) : userError ? (
              <Text fz="sm" c="red.7">{userError}</Text>
            ) : (
              <>
                <Text
                  fw={700}
                  fz="lg"
                  c="charcoal.9"
                >{user?.firstName} {user?.lastName}
                </Text>
                <Text c="charcoal.6" fz="sm">{user?.username}</Text>
                <Text c="charcoal.6" fz="sm">{STATIC_PROFILE_INFO.role}</Text>
                <Button
                  variant="subtle"
                  color="terracotta"
                  size="xs"
                  w="fit-content"
                  px={0}
                  onClick={startEditing}
                >
                  Edit profile
                </Button>
              </>
            )}

            <Stack gap={2} mt="md">
              <Text
                fw={700}
                fz="sm"
                c="charcoal.8"
              >Email
              </Text>
              <Text fz="sm" c="charcoal.7">{user?.email}</Text>
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
              <Text fz="sm" c="charcoal.7">{STATIC_PROFILE_INFO.mentorName}</Text>
            </Stack>

            <Divider mt="md" />
            <Button
              variant="subtle"
              color="red"
              loading={loggingOut}
              onClick={handleLogout}
            >
              Log out
            </Button>
          </Stack>

          <Stack
            style={{ flex: 1 }}
            miw={320}
            gap="xl"
          >
            <Stack gap="sm">
              <Group justify="space-between">
                <Text
                  fz="xl"
                  fw={700}
                  c="charcoal.9"
                >Chapters completed
                </Text>
                <Text c="charcoal.6">{completedMonolithIds.length} / {monoliths.length}</Text>
              </Group>
              <Stack gap={6}>
                {sortedMonoliths.map((monolith, index) => {
                  const completed = completedMonolithIds.includes(monolith.id);
                  return (
                    <Text
                      key={monolith.id}
                      fz="sm"
                      c={completed ? 'moss.8' : 'charcoal.6'}
                    >
                      Chapter {index + 1}: {completed ? 'Completed' : 'Not completed'}
                    </Text>
                  );
                })}
              </Stack>
            </Stack>
          </Stack>
        </Flex>
      </SectionCard>
    </Stack>
  );
}

export default Profile;
