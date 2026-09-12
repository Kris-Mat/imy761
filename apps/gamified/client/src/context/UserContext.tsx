import {
  createContext, useCallback, useContext, useEffect, useState
} from 'react';
import type { ReactNode } from 'react';
import { genConfig } from 'react-nice-avatar';
import { authApi } from '@shared/api/services/auth.api';
import { userApi } from '@shared/api/services/users.api';
import type { User } from '@shared/api/models/user.model';
import type { UserStats } from '@shared/api/models/user-stats.model';
import type { FarmProgress } from '@shared/api/models/farm.model';
import type { Achievement } from '@shared/api/models/achievement.model';
import { FALLBACK_FARMS } from '../lib/fallbackQuestData';

interface UserContextValue {
  user: User | null;
  stats: UserStats | null;
  farms: FarmProgress[] | null;
  // Empty rather than null while loading/unavailable — unlike stats/farms,
  // nothing in the app needs to distinguish "not loaded yet" from "none
  // earned", so callers can render it directly without a null check.
  achievements: Achievement[];
  loading: boolean;
  // Merges a partial update (e.g. after a Profile-page save) into the cached
  // user without a full re-sync, so every consumer (nav avatar, hero, Profile
  // sidebar) stays in step immediately.
  updateUser: (patch: Partial<User>) => void;
  // Re-fetches farms from the server and updates both state and the
  // sessionStorage cache — used after finishing a quest, since scoring and
  // unlocking happen server-side and the cached farms list would otherwise
  // stay stale for the rest of the session.
  refreshFarms: () => Promise<void>;
}

const userContext = createContext<UserContextValue | undefined>(undefined);

// Bump this whenever a cached model's shape changes in a breaking way (e.g.
// a new required field on UserStats). A stale cached object from a previous
// session render synchronously on mount, before the fresh fetch resolves —
// without this, a shape mismatch (like categoryAccuracy being undefined on
// an old cached UserStats) crashes the page instead of just falling through
// to a fresh fetch. Old-versioned keys are simply orphaned, not migrated.
const CACHE_VERSION = 'v2';

function cacheKey(kind: 'user' | 'stats' | 'farms' | 'achievements', supabaseId: string) {
  return `gamified:${CACHE_VERSION}:${kind}:${supabaseId}`;
}

function userCacheKey(supabaseId: string) {
  return cacheKey('user', supabaseId);
}

function statsCacheKey(supabaseId: string) {
  return cacheKey('stats', supabaseId);
}

function farmsCacheKey(supabaseId: string) {
  return cacheKey('farms', supabaseId);
}

function achievementsCacheKey(supabaseId: string) {
  return cacheKey('achievements', supabaseId);
}

function clearUserCache() {
  const prefix = `gamified:${CACHE_VERSION}:`;
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => sessionStorage.removeItem(key));
}

export function UserProvider({ children }: { children: ReactNode; }) {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [farms, setFarms] = useState<FarmProgress[] | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
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

      const cachedAchievements = sessionStorage.getItem(achievementsCacheKey(supabaseId));
      if (cachedAchievements) setAchievements(JSON.parse(cachedAchievements) as Achievement[]);

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
          .catch((error: unknown) => console.error('Failed to load farms', error)),
        userApi.getMyAchievements(accessToken)
          .then((freshAchievements) => {
            if (cancelled) return;
            setAchievements(freshAchievements);
            sessionStorage.setItem(achievementsCacheKey(supabaseId), JSON.stringify(freshAchievements));
          })
          .catch((error: unknown) => console.error('Failed to load achievements', error))
      ]);

      // Dev-only: if the backend never returned real farms (e.g. it's down
      // locally), fall back to placeholder data so the UI — including
      // navigating into a quest — stays testable without a working server.
      // Never runs in production builds.
      if (import.meta.env.DEV && !cancelled) {
        setFarms((prev) => prev ?? FALLBACK_FARMS);
      }
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
        setAchievements([]);
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

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev, ...patch
      };
      if (next.supabaseId) sessionStorage.setItem(userCacheKey(next.supabaseId), JSON.stringify(next));
      return next;
    });
  }, []);

  const refreshFarms = useCallback(async () => {
    const session = await authApi.getSession();
    if (!session) return;
    try {
      const freshFarms = await userApi.getMyFarms(session.access_token);
      setFarms(freshFarms);
      sessionStorage.setItem(farmsCacheKey(session.user.id), JSON.stringify(freshFarms));
    } catch (error) {
      console.error('Failed to refresh farms', error);
    }
  }, []);

  return (
    <userContext.Provider value={{
      user, stats, farms, achievements, loading, updateUser, refreshFarms
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
