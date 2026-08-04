import { useCallback, useState } from 'react';

// Maps a farm (level) id to the selected AnswerOption id per question index
// (undefined = not yet attempted). Storing the actual selection — not just a
// correct/incorrect flag — lets a revisited question redraw its reveal state
// (which option was picked, right or wrong) instead of resetting blank.
// There's no UserAttempt-recording endpoint for the gamified app yet, so
// this lives client-side for now — same pattern the plain app's
// ContentContext uses for chapter completion, just persisted so it survives
// a reload.
export type QuestProgress = Record<number, (number | undefined)[]>;

function progressCacheKey(supabaseId: string) {
  return `gamified:progress:${supabaseId}`;
}

function loadProgress(supabaseId: string | null | undefined): QuestProgress {
  if (!supabaseId) return {};
  const cached = localStorage.getItem(progressCacheKey(supabaseId));
  return cached ? (JSON.parse(cached) as QuestProgress) : {};
}

export function useQuestProgress(supabaseId: string | null | undefined) {
  // Re-derives from localStorage whenever the identity of supabaseId changes
  // (e.g. it resolves from undefined to a real id after login) — the same
  // "adjust state during render when a prop changes" pattern Profile.tsx
  // uses for its avatar/details drafts, rather than an effect.
  const [loadedFor, setLoadedFor] = useState(supabaseId);
  const [progress, setProgress] = useState<QuestProgress>(() => loadProgress(supabaseId));
  if (loadedFor !== supabaseId) {
    setLoadedFor(supabaseId);
    setProgress(loadProgress(supabaseId));
  }

  const markAnswered = useCallback((farmId: number, questionIndex: number, selectedOptionId: number, questionCount: number) => {
    if (!supabaseId) return;
    setProgress((prev) => {
      const existing = prev[farmId] ?? new Array(questionCount).fill(undefined);
      const next = existing.slice();
      next[questionIndex] = selectedOptionId;
      const updated = {
        ...prev, [farmId]: next
      };
      localStorage.setItem(progressCacheKey(supabaseId), JSON.stringify(updated));
      return updated;
    });
  }, [supabaseId]);

  return {
    progress, markAnswered
  };
}
