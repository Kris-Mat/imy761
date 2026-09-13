import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Avatar, Box, Button, Divider, Flex, Group, Paper, Stack, Text, TextInput, Title, UnstyledButton
} from '@mantine/core';
import NiceAvatar, { genConfig } from 'react-nice-avatar';
import type { AvatarFullConfig } from 'react-nice-avatar';
import { Icon } from '@shared/ui/Icon';
import type { IconName } from '@shared/ui/Icon';
import { LoadingPage } from '@shared/ui/LoadingPage';
import type { FarmProgress } from '@shared/api/models/farm.model';
import { authApi } from '@shared/api/services/auth.api';
import { userApi } from '@shared/api/services/users.api';
import { useUser } from '../context/UserContext';
import AvatarEditor from '../components/AvatarEditor';
import StaticMountainScene from '../components/StaticMountainScene';
import TrophyCase from '../components/TrophyCase';
import level1Pieter from '../assets/farmers/level-1-pieter.png';
import level2Nomsa from '../assets/farmers/level-2-nomsa.png';
import level3Willem from '../assets/farmers/level-3-willem.png';

type ProfileTab = 'progress' | 'achievements' | 'details' | 'avatar';
const PROFILE_TABS: ProfileTab[] = ['progress', 'achievements', 'details', 'avatar'];

const TAB_DEFS: { key: ProfileTab; label: string; icon: IconName; }[] = [
  {
    key: 'progress', label: 'Overall progress', icon: 'ChartLineUp'
  },
  {
    key: 'achievements', label: 'Achievements', icon: 'Trophy'
  },
  {
    key: 'details', label: 'User details', icon: 'PencilSimple'
  },
  {
    key: 'avatar', label: 'Avatar design', icon: 'Smiley'
  }
];

// Lets Dashboard's trophy-case preview link straight into the Achievements
// tab via /profile?tab=achievements — anything else (missing, mistyped,
// hand-edited) falls back to the default tab instead of erroring.
function toProfileTab(value: string | null): ProfileTab {
  return PROFILE_TABS.includes(value as ProfileTab) ? (value as ProfileTab) : 'progress';
}

interface DetailsForm {
  username: string;
  firstName: string;
  lastName: string;
}

function configsEqual(a: Required<AvatarFullConfig>, b: Required<AvatarFullConfig>) {
  return (Object.keys(a) as (keyof AvatarFullConfig)[]).every((key) => a[key] === b[key]);
}

function NavTabButton({ icon, label, active, onClick }: {
  icon: IconName; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <UnstyledButton
      onClick={onClick}
      px="sm"
      py={8}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderRadius: 'var(--mantine-radius-md)',
        background: active ? 'var(--mantine-color-terracotta-0)' : 'transparent',
        transition: 'background 150ms ease'
      }}
    >
      <Icon
        name={icon}
        size={18}
        color={active ? 'var(--mantine-color-terracotta-6)' : 'var(--mantine-color-charcoal-4)'}
      />
      <Text
        fz="sm"
        fw={active ? 800 : 600}
        c={active ? 'terracotta.8' : 'charcoal.7'}
      >
        {label}
      </Text>
    </UnstyledButton>
  );
}

// Keyed by orderIndex (levelNumber), matching the convention in
// FarmerProgressGrid.tsx/FarmRoad.tsx — the portrait is a presentation
// concern, not something the API needs to know about.
const farmerImages: Record<number, string> = {
  1: level1Pieter,
  2: level2Nomsa,
  3: level3Willem
};

// Fresh percentage coordinates for a small static card, not a scroll-driven
// scene — unlike Home's FarmRoad, this never needs to track scroll position,
// so it doesn't reuse ROAD_PIN_POSITIONS (an SVG-viewBox-specific coordinate
// system built for a much taller hero). Cycles if there are ever more farms
// than spots.
const PROGRESS_PIN_SPOTS: { left: string; top: string; }[] = [
  {
    left: '16%', top: '24%'
  },
  {
    left: '48%', top: '52%'
  },
  {
    left: '80%', top: '26%'
  },
  {
    left: '32%', top: '74%'
  },
  {
    left: '64%', top: '70%'
  }
];

// A compact, non-interactive summary of farm progress for the sidebar-less
// "My progress" tab — same soft-hill palette as hillGeometry.ts (StaticMountainScene's
// full-page hills), scaled down for a card instead of a full viewport.
function ProfileFarmRoad({ farms }: { farms: FarmProgress[]; }) {
  const currentFarmId = farms.find((farm) => !farm.completed)?.id ?? farms.at(-1)?.id;

  return (
    <Box
      pos="relative"
      h={160}
      style={{
        borderRadius: 'var(--mantine-radius-lg)', overflow: 'hidden', background: 'var(--mantine-color-charcoal-0)'
      }}
    >
      <Box
        pos="absolute"
        left="-10%"
        right="-10%"
        top={70}
        h={220}
        style={{
          borderRadius: '50%', background: 'linear-gradient(155deg, #cfdeb4, #aebf92)'
        }}
      />
      {farms.map((farm, index) => {
        const spot = PROGRESS_PIN_SPOTS[index % PROGRESS_PIN_SPOTS.length];
        const isCurrent = farm.id === currentFarmId;
        return (
          <Stack
            key={farm.id}
            pos="absolute"
            left={spot.left}
            top={spot.top}
            gap={6}
            align="center"
            style={{
              transform: 'translate(-50%, -50%)',
              zIndex: 1,
              animation: isCurrent ? 'dashboard-pin-bob 3.8s ease-in-out infinite' : 'none'
            }}
          >
            <Avatar
              src={farmerImages[farm.orderIndex]}
              alt={farm.farmerName}
              size={isCurrent ? 58 : 46}
              radius="50%"
              style={{
                border: isCurrent ? '4px solid var(--mantine-color-terracotta-6)' : '4px solid #fdf8ee',
                boxShadow: isCurrent ? '0 8px 20px rgba(86, 66, 40, 0.24)' : 'var(--mantine-shadow-xs)'
              }}
              imageProps={{ style: {
                objectFit: 'cover', objectPosition: '50% 15%'
              } }}
            />
            <Text
              fz={11}
              fw={800}
              px={10}
              py={3}
              style={{
                borderRadius: 999, background: '#fdf8ee', color: isCurrent ? 'var(--mantine-color-terracotta-8)' : 'var(--mantine-color-moss-8)'
              }}
            >
              {farm.farmerName}
            </Text>
          </Stack>
        );
      })}
    </Box>
  );
}

function ProfileContent() {
  const {
    user, stats, farms, achievements, updateUser
  } = useUser();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<ProfileTab>(() => toProfileTab(searchParams.get('tab')));
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
      pos="relative"
      mih="100vh"
      style={{ overflow: 'hidden' }}
    >
      <StaticMountainScene />
      <Box
        pos="relative"
        px="xl"
        pt={90}
        pb={80}
        maw={1180}
        mx="auto"
        style={{ zIndex: 1 }}
      >
        <Flex
          align="flex-start"
          gap={22}
          wrap="wrap"
        >
          <Paper
            radius="lg"
            p="xl"
            bg="#fdf8ee"
            w={280}
            ta="center"
            style={{
              flexShrink: 0, boxShadow: 'var(--mantine-shadow-md)'
            }}
          >
            <Box
              pos="relative"
              w={104}
              h={104}
              mx="auto"
              mb="md"
            >
              <NiceAvatar
                {...draftAvatarConfig}
                style={{
                  width: 104, height: 104, borderRadius: '50%', border: '5px solid var(--mantine-color-terracotta-6)'
                }}
              />
              <Box
                pos="absolute"
                right={-4}
                bottom={-4}
                w={32}
                h={32}
                style={{
                  borderRadius: '50%',
                  background: 'var(--mantine-color-moss-6)',
                  border: '3px solid #fdf8ee',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Icon
                  name="Leaf"
                  weight="fill"
                  size={14}
                  color="#fff8f1"
                />
              </Box>
            </Box>

            <Title
              order={3}
              fz={23}
              c="charcoal.9"
            >
              {user?.firstName}
              {' '}
              {user?.lastName}
            </Title>
            <Text
              fz="sm"
              fw={700}
              c="terracotta.8"
              mt={4}
            >
              {stats?.rank ?? 'Farmer'}
              {' '}
              &middot; @{user?.username}
            </Text>
            <Text
              fz="xs"
              c="charcoal.5"
              mt={3}
            >
              {user?.email}
            </Text>

            <Group
              justify="center"
              mt="md"
            >
              <Box
                px={12}
                py={5}
                style={{
                  borderRadius: 999, background: 'var(--mantine-color-moss-0)'
                }}
              >
                <Text
                  fz={12}
                  fw={800}
                  c="moss.8"
                >
                  {stats?.currentStreak ?? 0} day streak
                </Text>
              </Box>
            </Group>

            <Divider my="lg" />

            <Stack
              gap={4}
              ta="left"
            >
              {TAB_DEFS.map((tabDef) => (
                <NavTabButton
                  key={tabDef.key}
                  icon={tabDef.icon}
                  label={tabDef.label}
                  active={activeTab === tabDef.key}
                  onClick={() => selectTab(tabDef.key)}
                />
              ))}
            </Stack>

            <Divider my="lg" />

            <UnstyledButton
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                fontSize: 'var(--mantine-font-size-sm)', fontWeight: 800, color: 'var(--mantine-color-red-7)'
              }}
            >
              {loggingOut ? 'Logging out…' : 'Log out'}
            </UnstyledButton>
          </Paper>

          <Paper
            radius="lg"
            p={30}
            bg="#fdf8ee"
            style={{
              flex: 1, minWidth: 320, minHeight: 520, boxShadow: 'var(--mantine-shadow-md)'
            }}
          >
            {activeTab === 'progress' && (
              <Stack gap="xl">
                <Box>
                  <Title
                    order={1}
                    fz={30}
                    c="charcoal.9"
                  >
                    My progress
                  </Title>
                  <Text
                    fz="sm"
                    c="charcoal.6"
                    mt={6}
                  >
                    Your journey across the three farms so far.
                  </Text>
                </Box>

                <ProfileFarmRoad farms={farms ?? []} />
              </Stack>
            )}

            {activeTab === 'achievements' && (
              <Stack gap="md">
                <Box>
                  <Title
                    order={1}
                    fz={30}
                    c="charcoal.9"
                  >
                    Trophy case
                  </Title>
                  <Text
                    fz="sm"
                    c="charcoal.6"
                    mt={6}
                  >
                    {achievements.filter((achievement) => achievement.earned).length} of {achievements.length} earned so far.
                  </Text>
                </Box>
                <TrophyCase achievements={achievements} />
              </Stack>
            )}

            {activeTab === 'details' && (
              <Stack
                gap="md"
                maw={420}
              >
                <Title
                  order={1}
                  fz={30}
                  c="charcoal.9"
                >
                  User details
                </Title>
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
                <Title
                  order={1}
                  fz={30}
                  c="charcoal.9"
                >
                  Avatar design
                </Title>
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
          </Paper>
        </Flex>
      </Box>
    </Box>
  );
}

function Profile() {
  const { loading } = useUser();
  if (loading) return <LoadingPage />;
  return <ProfileContent />;
}

export default Profile;
