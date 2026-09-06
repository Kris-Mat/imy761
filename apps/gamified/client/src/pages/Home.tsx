import { useEffect, useMemo, useRef } from 'react';
import {
  Box, Flex, Group, Loader, SimpleGrid, Stack, Text, Title
} from '@mantine/core';
import NiceAvatar, { genConfig } from 'react-nice-avatar';
import type { AvatarFullConfig } from 'react-nice-avatar';
import { Icon } from '@shared/ui/Icon';
import MountainBackground from '../components/MountainBackground';
import FarmRoad from '../components/FarmRoad';
import StatCard from '../components/StatCard';
import SoilProfileBackground from '../components/SoilProfileBackground';
import { gsap } from '../lib/gsap';
import { useUser } from '../context/UserContext';
import { categoryLabels } from '../lib/questionCategory';

function Home() {
  const { user, farms, stats } = useUser();
  // Persisted per-user by UserContext on first login; genConfig() just fills
  // in a temporary random one for the brief window before that resolves.
  const avatarConfig = useMemo(
    () => genConfig((user?.avatarConfig ?? undefined) as AvatarFullConfig | undefined),
    [user?.avatarConfig]
  );

  const heroSectionRef = useRef<HTMLDivElement>(null);
  const statsSectionRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (heroContentRef.current) {
        gsap.to(heroContentRef.current, {
          y: -80,
          opacity: 0.15,
          ease: 'none',
          scrollTrigger: {
            trigger: heroSectionRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true
          }
        });
      }

      if (statsSectionRef.current) {
        const cards = statsSectionRef.current.querySelectorAll('.stat-card');
        gsap.timeline({
          scrollTrigger: {
            trigger: statsSectionRef.current,
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: true
          }
        })
          .fromTo(
            cards,
            {
              opacity: 0, y: 50 
            },
            {
              opacity: 1, y: 0, stagger: 0.05, duration: 0.3
            }
          )
          .to(cards, {
            y: -30, duration: 0.7 
          }, '>');
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <Box pos="relative">
      <Flex
        ref={heroSectionRef}
        component="section"
        pos="relative"
        direction="column"
        justify="center"
        h="100vh"
        px="xl"
        style={{ overflow: 'hidden' }}
      >
        <MountainBackground heroSectionRef={heroSectionRef} />
        <Flex
          ref={heroContentRef}
          pos="relative"
          direction={{
            base: 'column', md: 'row'
          }}
          align="center"
          justify="space-between"
          gap={40}
          maw={1500}
          w="100%"
          mx="auto"
          style={{ zIndex: 1 }}
        >
          <Flex
            align="center"
            gap={20}
            maw={640}
          >
            <NiceAvatar
              {...avatarConfig}
              style={{
                width: 250, height: 250, flexShrink: 0, borderRadius: '50%', border: '5px solid var(--mantine-color-moss-9)'
              }}
            />
            <Stack gap="xs">
              <Stack gap={0}>
                <Text
                  fz="xl"
                  fw={500}
                  c="charcoal.7"
                >
                  Welcome back
                </Text>
                <Title
                  order={1}
                  fz={72}
                  fw={800}
                  lh={1.05}
                  c="charcoal.9"
                  style={{ letterSpacing: '-2px' }}
                >
                  {user?.username ?? ''}
                </Title>
              </Stack>
              <Text
                c="charcoal.6"
                size="lg"
                mt="sm"
              >
                {stats && stats.currentStreak > 0
                  ? 'Your farms are waiting — pick up where you left off and keep the streak going.'
                  : 'Your farms are waiting — answer a question today to start your streak.'}
              </Text>
              <Group
                gap="lg"
                mt="xs"
              >
                <Group gap={6}>
                  <Icon
                    name="Flame"
                    size={20}
                    weight="fill"
                    color="var(--mantine-color-terracotta-6)"
                  />
                  <Text
                    fz="sm"
                    fw={600}
                    c="charcoal.7"
                  >
                    {stats && stats.currentStreak > 0
                      ? `${stats.currentStreak}-day streak`
                      : 'No streak yet'}
                  </Text>
                </Group>
                <Group gap={6}>
                  <Icon
                    name="Star"
                    size={20}
                    weight="fill"
                    color="var(--mantine-color-mustard-6)"
                  />
                  <Text
                    fz="sm"
                    fw={600}
                    c="charcoal.7"
                  >
                    {stats?.totalXp ?? 0}
                    {' '}
                    XP
                  </Text>
                </Group>
                {stats?.rank && (
                  <Group gap={6}>
                    <Icon
                      name="Medal"
                      size={20}
                      weight="fill"
                      color="var(--mantine-color-moss-7)"
                    />
                    <Text
                      fz="sm"
                      fw={600}
                      c="charcoal.7"
                    >
                      {stats.rank}
                    </Text>
                  </Group>
                )}
              </Group>
            </Stack>
          </Flex>
        </Flex>

        <FarmRoad
          farms={farms ?? []}
          heroSectionRef={heroSectionRef}
        />
      </Flex>

      <Flex
        ref={statsSectionRef}
        component="section"
        pos="relative"
        direction="column"
        justify="center"
        h="100vh"
        px="xl"
        style={{
          overflow: 'hidden', backgroundColor: 'var(--mantine-color-charcoal-5)'
        }}
      >
        <SoilProfileBackground statsSectionRef={statsSectionRef} />
        {stats ? (
          <SimpleGrid
            pos="relative"
            maw={700}
            w="50%"
            mx="auto"
            cols={2}
            spacing="lg"
            style={{ zIndex: 1 }}
          >
            {(stats.categoryAccuracy ?? []).map((entry) => (
              <StatCard
                key={entry.category}
                label={categoryLabels[entry.category]}
                value={entry.accuracyPercent !== null ? `${entry.accuracyPercent}%` : 'Not attempted'}
              />
            ))}
          </SimpleGrid>
        ) : (
          <Loader
            pos="relative"
            color="terracotta"
            style={{ zIndex: 1 }}
            mx="auto"
          />
        )}
      </Flex>
    </Box>
  );
}

export default Home;
