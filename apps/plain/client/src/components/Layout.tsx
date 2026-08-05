import { AppShell, Group, Anchor } from '@mantine/core';
import { NavLink as RouterNavLink, Outlet } from 'react-router';
import { Icon } from '@shared/ui/Icon';
import { ContentProvider } from '../context/ContentContext';

function NavItem({ to, label }: { to: string; label: string; }) {
  return (
    <Anchor
      component={RouterNavLink}
      to={to}
      underline="never"
      fz="lg"
      c="charcoal.7"
      style={({ isActive }: { isActive: boolean; }) => ({ fontWeight: isActive ? 700 : 400 })}
    >
      {label}
    </Anchor>
  );
}

function Layout() {
  return (
    <ContentProvider>
      <AppShell header={{ height: 68 }} padding="xl">
        <AppShell.Header bg="terracotta.0" style={{ border: 'none' }}>
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
                color="var(--mantine-color-terracotta-7)"
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
    </ContentProvider>
  );
}

export default Layout;
