import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Monolith } from '@shared/api/models/monolith.model';
import { monolithsApi } from '@shared/api/services/monoliths.api';

interface ContentContextValue {
  monoliths: Monolith[];
  loading: boolean;
  error: string | null;
  completedMonolithIds: number[];
  markMonolithCompleted: (monolithId: number) => void;
}

const contentContext = createContext<ContentContextValue | undefined>(undefined);

export function ContentProvider({ children }: { children: ReactNode; }) {
  const [monoliths, setMonoliths] = useState<Monolith[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedMonolithIds, setCompletedMonolithIds] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;

    monolithsApi.getMonoliths()
      .then((result) => {
        if (!cancelled) {
          setMonoliths(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Could not load chapter content.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<ContentContextValue>(() => ({
    monoliths,
    loading,
    error,
    completedMonolithIds,
    markMonolithCompleted: (monolithId: number) => {
      setCompletedMonolithIds((prev) => (prev.includes(monolithId) ? prev : [...prev, monolithId]));
    }
  }), [monoliths, loading, error, completedMonolithIds]);

  return <contentContext.Provider value={value}>{children}</contentContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook needs to live alongside the provider it reads from
export function useContent(): ContentContextValue {
  const context = useContext(contentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
}
