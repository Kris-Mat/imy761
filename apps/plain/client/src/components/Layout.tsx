import { AppShell, Group, Anchor } from '@mantine/core';
import { NavLink as RouterNavLink, Outlet } from 'react-router-dom';
import { Icon } from '@shared/ui/Icon';

function NavItem({ to, label }: { to: string; label: string; }) {
  return (
    <Anchor
      component={RouterNavLink}
      to={to}
      underline="never"
      fz="lg"
      c="soil.9"
      style={({ isActive }: { isActive: boolean; }) => ({ fontWeight: isActive ? 700 : 400 })}
    >
      {label}
    </Anchor>
  );
}

function Layout() {
  return (
    <AppShell header={{ height: 68 }} padding="xl">
      <AppShell.Header bg="soil.2" style={{ border: 'none' }}>
        <Group
          h="100%"
          px="xl"
          justify="space-between"
        >
          <Anchor component={RouterNavLink} to="/">
            <Icon
              name="Leaf"
              size={28}
              weight="fill"
              color="var(--mantine-color-soil-9)"
            />
          </Anchor>
          <Group gap={40}>
            <NavItem to="/tests" label="Tests" />
            <NavItem to="/profile" label="Profile" />
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

export default Layout;
