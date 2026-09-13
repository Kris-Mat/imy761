import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Monolith } from '@shared/api/models/monolith.model';
import { monolithsApi } from '@shared/api/services/monoliths.api';
import { authApi } from '@shared/api/services/auth.api';
import { userApi } from '@shared/api/services/users.api';

interface ContentContextValue {
  monoliths: Monolith[];
  loading: boolean;
  error: string | null;
  completedMonolithIds: number[];
  markMonolithCompleted: (monolithId: number) => void;
  // Latest attempt result per questionId — absent entries mean the question
  // hasn't been attempted yet. Fetched from the server so it survives a
  // reload, unlike completedMonolithIds above.
  questionResults: Map<number, boolean>;
  refreshQuestionResults: () => void;
}

const contentContext = createContext<ContentContextValue | undefined>(undefined);

export function ContentProvider({ children }: { children: ReactNode; }) {
  const [monoliths, setMonoliths] = useState<Monolith[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completedMonolithIds, setCompletedMonolithIds] = useState<number[]>([]);
  const [questionResults, setQuestionResults] = useState<Map<number, boolean>>(new Map());
  const [refreshCounter, setRefreshCounter] = useState(0);

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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const session = await authApi.getSession();
        if (!session) return;
        const attempts = await userApi.getMyAttempts(session.access_token);
        if (!cancelled) {
          setQuestionResults(new Map(attempts.map((attempt) => [attempt.questionId, attempt.isCorrect])));
        }
      } catch (fetchError) {
        console.error('Failed to load question attempt history', fetchError);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshCounter]);

  const value = useMemo<ContentContextValue>(() => ({
    monoliths,
    loading,
    error,
    completedMonolithIds,
    markMonolithCompleted: (monolithId: number) => {
      setCompletedMonolithIds((prev) => (prev.includes(monolithId) ? prev : [...prev, monolithId]));
    },
    questionResults,
    refreshQuestionResults: () => setRefreshCounter((prev) => prev + 1)
  }), [monoliths, loading, error, completedMonolithIds, questionResults]);

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
