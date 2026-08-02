import { useEffect, useMemo, useRef } from 'react';
import {
  Box, Flex, SimpleGrid, Stack, Text, Title
} from '@mantine/core';
import NiceAvatar, { genConfig } from 'react-nice-avatar';
import MountainBackground from '../components/MountainBackground';
import FarmRoad from '../components/FarmRoad';
import StatCard from '../components/StatCard';
import SoilProfileBackground from '../components/SoilProfileBackground';
import { gsap } from '../lib/gsap';
import { useUser } from '../context/UserContext';

function Home() {
  const { user, stats, farms } = useUser();
  // Random for now — will become user-editable once the profile page exists.
  const avatarConfig = useMemo(() => genConfig(), []);

  const displayStats = [
    {
      label: 'Points Earned', value: (stats?.totalXp ?? 0).toLocaleString()
    },
    {
      label: 'Rank', value: stats?.rank ?? 'Unranked'
    },
    {
      label: 'Tasks Completed', value: String(stats?.tasksCompleted ?? 0)
    },
    {
      label: 'Correct Answers', value: String(stats?.correctAnswers ?? 0)
    },
    {
      label: 'Current Streak', value: `${stats?.currentStreak ?? 0} day${stats?.currentStreak === 1 ? '' : 's'}`
    },
    {
      label: 'Badges Earned', value: String(stats?.badgesEarned ?? 0)
    }
  ];
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
          maw={1200}
          w="100%"
          mx="auto"
          style={{ zIndex: 1 }}
        >
          <Stack
            gap="xs"
            maw={420}
          >
            <NiceAvatar
              {...avatarConfig}
              style={{
                width: 96, height: 96
              }}
            />
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
              Your farms are waiting — pick up where you left off and keep the streak going.
            </Text>
          </Stack>

          <FarmRoad farms={farms ?? []} />
        </Flex>
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
        <SimpleGrid
          pos="relative"
          maw={1200}
          w="100%"
          mx="auto"
          cols={3}
          spacing="lg"
          style={{ zIndex: 1 }}
        >
          {displayStats.map((stat) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
            />
          ))}
        </SimpleGrid>
      </Flex>
    </Box>
  );
}

export default Home;
