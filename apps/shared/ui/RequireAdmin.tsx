import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { authApi } from '@shared/api/services/auth.api';
import { userApi } from '@shared/api/services/users.api';
import { LoadingPage } from '@shared/ui/LoadingPage';

type AdminStatus = 'checking' | 'admin' | 'not-admin';

// Nested under RequireAuth in each app's routes.ts, so by the time this runs
// the visitor is already known to be logged in — this only adds the
// ADMIN-role check on top. Neither app has a shared "current user" context
// reachable outside its own student Layout (the admin route deliberately
// skips that layout, see routes.ts), so this fetches the user itself via
// syncUser, same as RequireAuth fetches its own session.
export function RequireAdmin() {
  const [status, setStatus] = useState<AdminStatus>('checking');

  useEffect(() => {
    let cancelled = false;

    authApi.getSession().then((session) => {
      if (!session) {
        if (!cancelled) setStatus('not-admin');
        return;
      }
      userApi.syncUser(session.access_token)
        .then((user) => {
          if (!cancelled) setStatus(user.role === 'ADMIN' ? 'admin' : 'not-admin');
        })
        .catch((error: unknown) => {
          console.error('Failed to verify admin role', error);
          if (!cancelled) setStatus('not-admin');
        });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'checking') return <LoadingPage />;
  // Redirects to the normal home page rather than /login — a non-admin
  // hitting /admin is already authenticated, just not authorized.
  if (status === 'not-admin') return <Navigate to="/" replace />;
  return <Outlet />;
}
