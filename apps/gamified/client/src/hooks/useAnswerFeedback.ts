import { useReducedMotion } from '@mantine/hooks';

// Every question type (MCQ, soil-family-code digits, Munsell value) renders
// through the one QuestionScreen/Radio.Group flow in QuestRunner.tsx, so a
// single hook covering that one flow already covers all of them — there's no
// separate animation path to duplicate per type.
//
// prefers-reduced-motion is handled here rather than in CSS: the animations
// this drives are applied via inline `style={{ animation }}`, which an
// `@media (prefers-reduced-motion)` rule in a stylesheet can't override.
// Falling back to `undefined` here means the option keeps its colour-only
// state (border/background) with no motion at all. The instant grey-out
// (`opacity: dimmed ? 0.55 : 1`) lives outside this hook entirely and is
// never touched by it — it's a correctness signal, not a motion effect.
export function useAnswerFeedback() {
  // Read synchronously rather than the hook's default effect-deferred value:
  // QuestionScreen can mount already-revealed (review mode), so an
  // effect-deferred read would let an animation fire once for a
  // reduced-motion user before the correct value lands a render later.
  const reducedMotion = useReducedMotion(false, { getInitialValueInEffect: false });

  // Snap + scale-bounce + colour bloom for the option that was right.
  function correctOptionAnimation(): string | undefined {
    if (reducedMotion) return undefined;
    return 'quest-option-pop 420ms ease-out, quest-option-bloom 550ms ease-out';
  }

  // A small, contained wobble for the user's own wrong pick only — never the
  // other (dimmed) options, and never in place of the grey-out.
  function wrongOptionAnimation(): string | undefined {
    if (reducedMotion) return undefined;
    return 'quest-option-wobble 150ms ease-in-out';
  }

  function feedbackPanelAnimation(): string | undefined {
    if (reducedMotion) return undefined;
    return 'quest-feedback-rise 360ms cubic-bezier(0.22, 0.72, 0.15, 1)';
  }

  return {
    reducedMotion, correctOptionAnimation, wrongOptionAnimation, feedbackPanelAnimation
  };
}
