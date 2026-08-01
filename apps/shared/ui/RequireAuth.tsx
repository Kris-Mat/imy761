import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import { authApi } from '@shared/api/services/auth.api';

type AuthStatus = 'checking' | 'authenticated' | 'unauthenticated';

export function RequireAuth() {
  const [status, setStatus] = useState<AuthStatus>('checking');

  useEffect(() => {
    authApi.getSession().then((session) => {
      setStatus(session ? 'authenticated' : 'unauthenticated');
    });

    const { data } = authApi.onAuthStateChange((session) => {
      setStatus(session ? 'authenticated' : 'unauthenticated');
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (status === 'checking') return null;
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  return <Outlet />;
}
