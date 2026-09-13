import { Anchor, Box, Group } from '@mantine/core';
import { NavLink as RouterNavLink, Outlet } from 'react-router';
import { Icon } from '@shared/ui/Icon';
import { AdminNavLink } from '@shared/ui/AdminNavLink';
import { ContentProvider } from '../context/ContentContext';
import StaticMountainScene from './StaticMountainScene';

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

function Layout() {
  return (
    <ContentProvider>
      <StaticMountainScene />

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
          to="/tests"
          label="Tests"
        />
        <AdminNavLink />
        <NavItem
          to="/profile"
          label="Profile"
        />
      </Group>

      <Box
        component="main"
        pos="relative"
        mih="100vh"
        px="xl"
        pt={140}
        pb={80}
        style={{ zIndex: 1 }}
      >
        <Outlet />
      </Box>
    </ContentProvider>
  );
}

export default Layout;
