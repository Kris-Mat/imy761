import { useEffect, useState } from 'react';
import { monolithsApi } from '@shared/api/services/monoliths.api';
import type { Monolith } from '@shared/api/models/monolith.model';
import { FALLBACK_MONOLITHS } from '../lib/fallbackQuestData';

export function useMonoliths() {
  const [monoliths, setMonoliths] = useState<Monolith[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    monolithsApi.getMonoliths()
      .then((result) => {
        if (!cancelled) setMonoliths(result);
      })
      .catch((error: unknown) => {
        console.error('Failed to load monoliths', error);
        // Dev-only fallback, mirrors UserContext's farms fallback — never
        // runs in production builds.
        if (import.meta.env.DEV && !cancelled) setMonoliths(FALLBACK_MONOLITHS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    monoliths, loading
  };
}
