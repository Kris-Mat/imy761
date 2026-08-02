import {
  createContext, useContext, useEffect, useState
} from 'react';
import type { ReactNode } from 'react';
import { genConfig } from 'react-nice-avatar';
import { authApi } from '@shared/api/services/auth.api';
import { userApi } from '@shared/api/services/users.api';
import type { User } from '@shared/api/models/user.model';
import type { UserStats } from '@shared/api/models/user-stats.model';
import type { FarmProgress } from '@shared/api/models/farm.model';

interface UserContextValue {
  user: User | null;
  stats: UserStats | null;
  farms: FarmProgress[] | null;
  loading: boolean;
}

const userContext = createContext<UserContextValue | undefined>(undefined);

function userCacheKey(supabaseId: string) {
  return `gamified:user:${supabaseId}`;
}

function statsCacheKey(supabaseId: string) {
  return `gamified:stats:${supabaseId}`;
}

function farmsCacheKey(supabaseId: string) {
  return `gamified:farms:${supabaseId}`;
}

function clearUserCache() {
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith('gamified:user:')
      || key.startsWith('gamified:stats:')
      || key.startsWith('gamified:farms:'))
    .forEach((key) => sessionStorage.removeItem(key));
}

export function UserProvider({ children }: { children: ReactNode; }) {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [farms, setFarms] = useState<FarmProgress[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const syncForSession = async (supabaseId: string, accessToken: string) => {
      const cachedUser = sessionStorage.getItem(userCacheKey(supabaseId));
      if (cachedUser) setUser(JSON.parse(cachedUser) as User);

      const cachedStats = sessionStorage.getItem(statsCacheKey(supabaseId));
      if (cachedStats) setStats(JSON.parse(cachedStats) as UserStats);

      const cachedFarms = sessionStorage.getItem(farmsCacheKey(supabaseId));
      if (cachedFarms) setFarms(JSON.parse(cachedFarms) as FarmProgress[]);

      if (cachedUser || cachedStats || cachedFarms) setLoading(false);

      try {
        const freshUser = await userApi.syncUser(accessToken);
        if (cancelled) return;

        // First login ever for this account: no avatar has been generated
        // yet. Generate one now and persist it immediately so it's stable
        // from here on — same config every time, until the (future) profile
        // page changes it.
        if (!freshUser.avatarConfig) {
          try {
            freshUser.avatarConfig = await userApi.saveMyAvatar(accessToken, genConfig());
          } catch (error) {
            console.error('Failed to save initial avatar', error);
          }
        }

        if (cancelled) return;
        setUser(freshUser);
        sessionStorage.setItem(userCacheKey(supabaseId), JSON.stringify(freshUser));
      } catch (error) {
        console.error('Failed to sync user', error);
      } finally {
        if (!cancelled) setLoading(false);
      }

      // Independent of each other and of the user sync above: one endpoint
      // failing (e.g. a stale server not yet restarted with a new route)
      // shouldn't stop the other from populating.
      await Promise.allSettled([
        userApi.getMyStats(accessToken)
          .then((freshStats) => {
            if (cancelled) return;
            setStats(freshStats);
            sessionStorage.setItem(statsCacheKey(supabaseId), JSON.stringify(freshStats));
          })
          .catch((error: unknown) => console.error('Failed to load stats', error)),
        userApi.getMyFarms(accessToken)
          .then((freshFarms) => {
            if (cancelled) return;
            setFarms(freshFarms);
            sessionStorage.setItem(farmsCacheKey(supabaseId), JSON.stringify(freshFarms));
          })
          .catch((error: unknown) => console.error('Failed to load farms', error))
      ]);
    };

    authApi.getSession().then((session) => {
      if (!session) {
        setLoading(false);
        return;
      }
      syncForSession(session.user.id, session.access_token);
    });

    const { data } = authApi.onAuthStateChange((session) => {
      if (!session) {
        clearUserCache();
        setUser(null);
        setStats(null);
        setFarms(null);
        setLoading(false);
        return;
      }
      syncForSession(session.user.id, session.access_token);
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <userContext.Provider value={{
      user, stats, farms, loading
    }}
    >
      {children}
    </userContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook needs to live alongside the provider it reads from
export function useUser() {
  const context = useContext(userContext);
  if (!context) throw new Error('useUser must be used within a UserProvider');
  return context;
}
