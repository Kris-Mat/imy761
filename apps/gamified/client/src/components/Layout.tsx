import { useEffect, useMemo, useRef } from 'react';
import { Anchor, Box, Group } from '@mantine/core';
import { NavLink as RouterNavLink, Outlet } from 'react-router';
import NiceAvatar, { genConfig } from 'react-nice-avatar';
import type { AvatarFullConfig } from 'react-nice-avatar';
import { Icon } from '@shared/ui/Icon';
import { AdminNavLink } from '@shared/ui/AdminNavLink';
import { ScrollSmoother } from '../lib/gsap';
import { UserProvider, useUser } from '../context/UserContext';

function NavItem({ to, label }: { to: string; label: string; }) {
  return (
    <Anchor
      component={RouterNavLink}
      to={to}
      underline="never"
      fz="lg"
      fw={600}
      c="charcoal.8"
      style={({ isActive }: { isActive: boolean; }) => ({ opacity: isActive ? 1 : 0.6 })}
    >
      {label}
    </Anchor>
  );
}

function ProfileNavAvatar() {
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
        opacity: isActive ? 1 : 0.6,
        display: 'flex'
      })}
    >
      <NiceAvatar
        {...avatarConfig}
        style={{
          width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--mantine-color-moss-9)'
        }}
      />
    </Anchor>
  );
}

function Layout() {
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
        pos="fixed"
        top={20}
        left="50%"
        justify="space-between"
        w="40%"
        px={28}
        py={10}
        style={{
          transform: 'translateX(-50%)',
          zIndex: 100,
          borderRadius: 999,
          border: '1px solid var(--mantine-color-moss-9)',
          backgroundColor: 'var(--mantine-color-body)'
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
          />
        </Anchor>
        <NavItem
          to="/quests"
          label="Quests"
        />
        <AdminNavLink />
        <ProfileNavAvatar />
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
