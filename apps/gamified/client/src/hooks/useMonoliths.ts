import { useEffect, useState } from 'react';
import { monolithsApi } from '@shared/api/services/monoliths.api';
import type { Monolith } from '@shared/api/models/monolith.model';

export function useMonoliths() {
  const [monoliths, setMonoliths] = useState<Monolith[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    monolithsApi.getMonoliths()
      .then((result) => {
        if (!cancelled) setMonoliths(result);
      })
      .catch((error: unknown) => console.error('Failed to load monoliths', error))
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
