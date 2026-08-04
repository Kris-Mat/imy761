import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box, Button, Divider, Flex, Group, Paper, Stack, Text, TextInput, UnstyledButton
} from '@mantine/core';
import NiceAvatar, { genConfig } from 'react-nice-avatar';
import type { AvatarFullConfig } from 'react-nice-avatar';
import { LoadingPage } from '@shared/ui/LoadingPage';
import { authApi } from '@shared/api/services/auth.api';
import { userApi } from '@shared/api/services/users.api';
import { useUser } from '../context/UserContext';
import FarmerProgressGrid from '../components/FarmerProgressGrid';
import AvatarEditor from '../components/AvatarEditor';

type ProfileTab = 'progress' | 'details' | 'avatar';

interface DetailsForm {
  username: string;
  firstName: string;
  lastName: string;
}

function configsEqual(a: Required<AvatarFullConfig>, b: Required<AvatarFullConfig>) {
  return (Object.keys(a) as (keyof AvatarFullConfig)[]).every((key) => a[key] === b[key]);
}

function NavTabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void; }) {
  return (
    <UnstyledButton
      onClick={onClick}
      py={8}
      style={{
        fontSize: 'var(--mantine-font-size-md)',
        fontWeight: active ? 700 : 500,
        color: active ? 'var(--mantine-color-terracotta-7)' : 'var(--mantine-color-charcoal-6)',
        transition: 'color 150ms ease'
      }}
    >
      {label}
    </UnstyledButton>
  );
}

function ProfileContent() {
  const { user, farms, updateUser } = useUser();
  const [activeTab, setActiveTab] = useState<ProfileTab>('progress');
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

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

  const persistedAvatarConfig = useMemo(
    () => genConfig((user?.avatarConfig ?? undefined) as AvatarFullConfig | undefined),
    [user?.avatarConfig]
  );
  const [draftAvatarConfig, setDraftAvatarConfig] = useState(persistedAvatarConfig);
  // Reset the draft whenever the persisted config identity changes (initial
  // load, or right after a successful save) — done during render, per React's
  // "adjusting state when a prop changes" pattern, rather than in an effect.
  const [syncedAvatarConfig, setSyncedAvatarConfig] = useState(persistedAvatarConfig);
  if (persistedAvatarConfig !== syncedAvatarConfig) {
    setSyncedAvatarConfig(persistedAvatarConfig);
    setDraftAvatarConfig(persistedAvatarConfig);
  }
  const avatarDirty = !configsEqual(draftAvatarConfig, persistedAvatarConfig);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const persistedDetails = useMemo<DetailsForm>(() => ({
    username: user?.username ?? '',
    firstName: user?.firstName ?? '',
    lastName: user?.lastName ?? ''
  }), [user?.username, user?.firstName, user?.lastName]);
  const [draftDetails, setDraftDetails] = useState(persistedDetails);
  const [syncedDetails, setSyncedDetails] = useState(persistedDetails);
  if (persistedDetails !== syncedDetails) {
    setSyncedDetails(persistedDetails);
    setDraftDetails(persistedDetails);
  }
  const detailsDirty = draftDetails.username !== persistedDetails.username
    || draftDetails.firstName !== persistedDetails.firstName
    || draftDetails.lastName !== persistedDetails.lastName;
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  function selectTab(next: ProfileTab) {
    // Leaving a tab with unsaved changes discards the draft, matching the
    // "cancel changes" behaviour for a tab switch instead of an explicit click.
    if (activeTab === 'avatar' && avatarDirty) setDraftAvatarConfig(persistedAvatarConfig);
    if (activeTab === 'details' && detailsDirty) setDraftDetails(persistedDetails);
    setActiveTab(next);
  }

  async function handleSaveAvatar() {
    setSavingAvatar(true);
    setAvatarError(null);
    try {
      const session = await authApi.getSession();
      if (!session) throw new Error('Not authenticated');
      const saved = await userApi.saveMyAvatar(session.access_token, draftAvatarConfig);
      updateUser({ avatarConfig: saved });
    } catch (error) {
      console.error('Failed to save avatar', error);
      setAvatarError('Failed to save your avatar. Please try again.');
    } finally {
      setSavingAvatar(false);
    }
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
      updateUser(saved);
    } catch (error) {
      console.error('Failed to save details', error);
      setDetailsError('Failed to save your changes. Please try again.');
    } finally {
      setSavingDetails(false);
    }
  }

  return (
    <Box
      px="xl"
      pt={140}
      pb={80}
      maw={1100}
      mx="auto"
    >
      <Paper
        radius="lg"
        shadow="sm"
        style={{
          overflow: 'hidden', border: '1px solid var(--mantine-color-charcoal-2)' 
        }}
      >
        <Flex align="stretch">
          <Stack
            w={260}
            p="xl"
            gap="xl"
            style={{
              flexShrink: 0, borderRight: '1px solid var(--mantine-color-charcoal-2)'
            }}
          >
            <Stack
              align="center"
              gap="xs"
            >
              <NiceAvatar
                {...draftAvatarConfig}
                style={{
                  width: 120, height: 120, borderRadius: '50%', border: '3px solid var(--mantine-color-mustard-5)'
                }}
              />
              <Stack
                gap={0}
                align="center"
              >
                <Text
                  fz="lg"
                  fw={700}
                  c="charcoal.9"
                  ta="center"
                >
                  {user?.firstName}
                  {' '}
                  {user?.lastName}
                </Text>
                <Text
                  fz="sm"
                  c="charcoal.6"
                >
                  {user?.username}
                </Text>
                <Text
                  fz="sm"
                  c="charcoal.5"
                >
                  {user?.email}
                </Text>
              </Stack>
            </Stack>

            <Stack gap={4}>
              <NavTabButton
                label="Overall Progress"
                active={activeTab === 'progress'}
                onClick={() => selectTab('progress')}
              />
              <NavTabButton
                label="User details"
                active={activeTab === 'details'}
                onClick={() => selectTab('details')}
              />
              <NavTabButton
                label="Avatar Design"
                active={activeTab === 'avatar'}
                onClick={() => selectTab('avatar')}
              />
            </Stack>

            <Stack mt="auto">
              <Divider />
              <Button
                variant="subtle"
                color="red"
                loading={loggingOut}
                onClick={handleLogout}
              >
                Log out
              </Button>
            </Stack>
          </Stack>

          <Box
            p="xl"
            style={{
              flex: 1, minWidth: 0 
            }}
          >
            {activeTab === 'progress' && (
              <Stack gap="xl">
                <Stack gap="md">
                  <Text
                    fz="xl"
                    fw={700}
                    c="charcoal.9"
                  >
                    My Progress
                  </Text>
                  <FarmerProgressGrid farms={farms ?? []} />
                </Stack>

                <Divider />

                <Stack gap="xs">
                  <Text
                    fz="xl"
                    fw={700}
                    c="charcoal.9"
                  >
                    My Academic Goals
                  </Text>
                  <Text
                    component="ul"
                    c="charcoal.7"
                    style={{
                      margin: 0, paddingLeft: 20 
                    }}
                  >
                    <li>Study 6 days a week</li>
                    <li>&gt; 70% in semester test</li>
                    <li>&gt; 65% for module</li>
                  </Text>
                  <Stack
                    gap={4}
                    mt="sm"
                  >
                    <Text
                      fz="sm"
                      fw={600}
                      c="charcoal.7"
                    >
                      Comments from mentor:
                    </Text>
                    <Text
                      fz="sm"
                      fs="italic"
                      c="charcoal.6"
                    >
                      &ldquo;Keep up the consistent effort — your progress is showing in your marks.&rdquo;
                    </Text>
                  </Stack>
                </Stack>
              </Stack>
            )}

            {activeTab === 'details' && (
              <Stack
                gap="md"
                maw={420}
              >
                <Text
                  fz="xl"
                  fw={700}
                  c="charcoal.9"
                >
                  User details
                </Text>
                <TextInput
                  label="Username"
                  value={draftDetails.username}
                  onChange={(event) => setDraftDetails((prev) => ({
                    ...prev, username: event.currentTarget.value 
                  }))}
                />
                <Group grow>
                  <TextInput
                    label="First name"
                    value={draftDetails.firstName}
                    onChange={(event) => setDraftDetails((prev) => ({
                      ...prev, firstName: event.currentTarget.value 
                    }))}
                  />
                  <TextInput
                    label="Last name"
                    value={draftDetails.lastName}
                    onChange={(event) => setDraftDetails((prev) => ({
                      ...prev, lastName: event.currentTarget.value 
                    }))}
                  />
                </Group>
                <Stack gap={2}>
                  <Text
                    fz="sm"
                    fw={500}
                    c="charcoal.6"
                  >
                    Email
                  </Text>
                  <Text
                    fz="md"
                    c="charcoal.8"
                  >
                    {user?.email}
                  </Text>
                </Stack>

                {detailsError && (
                  <Text
                    fz="sm"
                    c="red.7"
                  >
                    {detailsError}
                  </Text>
                )}

                <Group
                  justify="flex-end"
                  mt="md"
                  pt="md"
                  style={{ borderTop: '1px solid var(--mantine-color-charcoal-2)' }}
                >
                  <Button
                    variant="default"
                    disabled={!detailsDirty || savingDetails}
                    onClick={() => {
                      setDraftDetails(persistedDetails);
                      setDetailsError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="terracotta"
                    disabled={!detailsDirty}
                    loading={savingDetails}
                    onClick={handleSaveDetails}
                  >
                    Save changes
                  </Button>
                </Group>
              </Stack>
            )}

            {activeTab === 'avatar' && (
              <Stack gap="md">
                <Text
                  fz="xl"
                  fw={700}
                  c="charcoal.9"
                >
                  Avatar Design
                </Text>
                <AvatarEditor
                  config={draftAvatarConfig}
                  onChange={(patch) => setDraftAvatarConfig((prev) => ({
                    ...prev, ...patch 
                  }))}
                />

                {avatarError && (
                  <Text
                    fz="sm"
                    c="red.7"
                  >
                    {avatarError}
                  </Text>
                )}

                <Group
                  justify="flex-end"
                  mt="md"
                  pt="md"
                  style={{ borderTop: '1px solid var(--mantine-color-charcoal-2)' }}
                >
                  <Button
                    variant="default"
                    disabled={!avatarDirty || savingAvatar}
                    onClick={() => {
                      setDraftAvatarConfig(persistedAvatarConfig);
                      setAvatarError(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    color="terracotta"
                    disabled={!avatarDirty}
                    loading={savingAvatar}
                    onClick={handleSaveAvatar}
                  >
                    Save changes
                  </Button>
                </Group>
              </Stack>
            )}
          </Box>
        </Flex>
      </Paper>
    </Box>
  );
}

function Profile() {
  const { loading } = useUser();
  if (loading) return <LoadingPage />;
  return <ProfileContent />;
}

export default Profile;
