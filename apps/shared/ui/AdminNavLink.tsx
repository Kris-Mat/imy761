import { useEffect, useState } from 'react';
import { NavLink as RouterNavLink } from 'react-router';
import { Anchor } from '@mantine/core';
import { authApi } from '@shared/api/services/auth.api';
import { userApi } from '@shared/api/services/users.api';

// Renders nothing unless the logged-in user is ADMIN — regular students
// never see this link. RequireAdmin (see RequireAdmin.tsx) still gates the
// /admin destination itself; this only spares an admin from hand-typing the
// URL every time, so it deliberately re-checks role independently rather
// than trusting anything cached client-side.
export function AdminNavLink() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;

    authApi.getSession().then((session) => {
      if (!session) return;
      userApi.syncUser(session.access_token)
        .then((user) => {
          if (!cancelled && user.role === 'ADMIN') setIsAdmin(true);
        })
        .catch((error: unknown) => console.error('Failed to check admin role for nav link', error));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isAdmin) return null;

  return (
    <Anchor
      component={RouterNavLink}
      to="/admin"
      underline="never"
      fz="lg"
      fw={600}
      c="charcoal.8"
      style={({ isActive }: { isActive: boolean; }) => ({ opacity: isActive ? 1 : 0.6 })}
    >
      Admin
    </Anchor>
  );
}
