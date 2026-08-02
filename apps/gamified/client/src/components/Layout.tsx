import { useEffect, useMemo, useRef } from 'react';
import { Anchor, Box, Group } from '@mantine/core';
import { NavLink as RouterNavLink, Outlet } from 'react-router';
import { useHover } from '@mantine/hooks';
import NiceAvatar, { genConfig } from 'react-nice-avatar';
import type { AvatarFullConfig } from 'react-nice-avatar';
import { Icon } from '@shared/ui/Icon';
import { ScrollSmoother } from '../lib/gsap';
import { UserProvider, useUser } from '../context/UserContext';

function NavItem({ to, label, opacity }: { to: string; label: string; opacity: number; }) {
  return (
    <Anchor
      component={RouterNavLink}
      to={to}
      underline="never"
      fz="lg"
      fw={600}
      c="charcoal.8"
      style={({ isActive }: { isActive: boolean; }) => ({
        opacity: isActive ? 1 : opacity,
        transition: 'opacity 200ms ease'
      })}
    >
      {label}
    </Anchor>
  );
}

function ProfileNavAvatar({ opacity }: { opacity: number; }) {
  const { user } = useUser();
  const avatarConfig = useMemo(
    () => genConfig((user?.avatarConfig ?? undefined) as AvatarFullConfig | undefined),
    [user?.avatarConfig]
  );

  return (
    <Anchor
      component={RouterNavLink}
      to="/profile"
      underline="never"
      style={({ isActive }: { isActive: boolean; }) => ({
        opacity: isActive ? 1 : opacity,
        transition: 'opacity 200ms ease',
        display: 'flex'
      })}
    >
      <NiceAvatar
        {...avatarConfig}
        style={{
          width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--mantine-color-mustard-5)'
        }}
      />
    </Anchor>
  );
}

function Layout() {
  const { hovered, ref } = useHover<HTMLDivElement>();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const smoother = ScrollSmoother.create({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      smooth: 1.3
    });

    return () => smoother.kill();
  }, []);

  return (
    <UserProvider>
      <Group
        ref={ref}
        pos="fixed"
        top={20}
        left="50%"
        gap={32}
        px={28}
        py={10}
        style={{
          transform: 'translateX(-50%)',
          zIndex: 100,
          borderRadius: 999,
          border: `1px solid ${hovered ? 'var(--mantine-color-charcoal-3)' : 'transparent'}`,
          backgroundColor: hovered ? 'var(--mantine-color-body)' : 'transparent',
          transition: 'border-color 200ms ease, background-color 200ms ease'
        }}
      >
        <Anchor
          component={RouterNavLink}
          to="/"
          underline="never"
        >
          <Icon
            name="Leaf"
            size={24}
            weight="fill"
            color="var(--mantine-color-terracotta-7)"
            style={{
              opacity: hovered ? 1 : 0.5, transition: 'opacity 200ms ease'
            }}
          />
        </Anchor>
        <NavItem
          to="/tests"
          label="Tests"
          opacity={hovered ? 0.75 : 0.15}
        />
        <ProfileNavAvatar opacity={hovered ? 0.75 : 0.15} />
      </Group>

      <div
        id="smooth-wrapper"
        ref={wrapperRef}
      >
        <div
          id="smooth-content"
          ref={contentRef}
        >
          <Box component="main">
            <Outlet />
          </Box>
        </div>
      </div>
    </UserProvider>
  );
}

export default Layout;
