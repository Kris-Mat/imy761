import type { FarmProgress } from '@shared/api/models/farm.model';
import type { Monolith, Question, QuestionCategory } from '@shared/api/models/monolith.model';
import { hasAttempted, hasFinished } from './questProgress';
import { categoryLabels } from './questionCategory';

export type PipStatus = 'correct' | 'incorrect' | 'unattempted';
export type DayStatus = 'explore' | 'ready' | 'active' | 'done' | 'unavailable';

export interface QuestDayPart {
  questionId: number;
  status: PipStatus;
  // Always a direct deep-link to this exact question — unlike the day-level
  // target, a per-part row is an explicit "review/retry/answer this one"
  // request, not "start the day", so it never funnels through step 0 first.
  target: QuestTarget;
}

export interface QuestTarget {
  stepIndex: number;
  mode: 'play' | 'review';
  phase?: 'explore';
}

export interface QuestDay {
  key: string;
  title: string;
  blurb: string;
  status: DayStatus;
  // Empty for the two synthetic days (explore/summary) — they aren't graded
  // questions themselves.
  parts: QuestDayPart[];
  // Null only for the summary day before the quest has been finished —
  // there's no completion data yet to show, not a progression gate (every
  // day/farm stays playable in any order; this is the one existing
  // exception, matching the pre-redesign "Summary row only once finished"
  // behaviour).
  target: QuestTarget | null;
}

// Builds the exact URL QuestRunner already expects for a target — same
// /quests/:farmId/:stepIndex route, ?mode=review and ?phase=explore query
// params it already reads (see QuestRunner.tsx's `mode`/`initialPhase`
// derivation), so this never invents a new navigation shape.
export function questTargetUrl(farmId: number, target: QuestTarget): string {
  const params = new URLSearchParams();
  if (target.mode === 'review') params.set('mode', 'review');
  if (target.phase) params.set('phase', target.phase);
  const query = params.toString();
  return `/quests/${farmId}/${target.stepIndex}${query ? `?${query}` : ''}`;
}

// Groups a monolith's questions into "days": a synthetic Explore day first
// (matching QuestRunner's existing explore phase, reached the same way the
// old Quests.tsx's "Soil Profile" row already did — /quests/:farmId/0
// ?phase=explore), one day per QuestionCategory in the order questions
// already come in (categoryLabels supplies the title — never hand-typed per
// farm, so this holds up regardless of how many questions land in a
// category, e.g. Soil Family Code's 4 digit questions), and a synthetic
// Harvest day last (matching the old Trophy/"Summary" row's target —
// /quests/:farmId/<question count>, only once the quest is finished).
export function buildQuestDays(monolith: Monolith, farm: FarmProgress): QuestDay[] {
  const progressByQuestionId = new Map(farm.questions.map((entry) => [entry.questionId, entry]));
  const stepIndexByQuestionId = new Map(monolith.questions.map((question, index) => [question.id, index]));

  const categoryOrder: QuestionCategory[] = [];
  const questionsByCategory = new Map<QuestionCategory, Question[]>();
  for (const question of monolith.questions) {
    if (!questionsByCategory.has(question.category)) {
      categoryOrder.push(question.category);
      questionsByCategory.set(question.category, []);
    }
    questionsByCategory.get(question.category)!.push(question);
  }

  // Before the farm's very first-ever attempt, every category day routes
  // through the normal step-0 walkthrough (intro -> explore -> questions)
  // rather than deep-linking into the middle of it — matching the old
  // per-question row logic, which only deep-linked once `hasAttempted`.
  const farmAttempted = hasAttempted(farm);

  const days: QuestDay[] = [
    {
      key: 'explore',
      title: 'Walk the Profile',
      blurb: 'Study the soil profile before answering any questions about it.',
      status: farm.visited ? 'done' : 'ready',
      parts: [],
      target: {
        stepIndex: 0, mode: 'play', phase: 'explore'
      }
    }
  ];

  for (const category of categoryOrder) {
    const questions = questionsByCategory.get(category)!;
    const parts: QuestDayPart[] = questions.map((question) => {
      const progress = progressByQuestionId.get(question.id);
      const status: PipStatus = !progress || progress.isCorrect === null
        ? 'unattempted'
        : (progress.isCorrect ? 'correct' : 'incorrect');
      return {
        questionId: question.id,
        status,
        target: {
          stepIndex: stepIndexByQuestionId.get(question.id)!,
          mode: status === 'correct' ? 'review' : 'play'
        }
      };
    });

    const attemptedCount = parts.filter((part) => part.status !== 'unattempted').length;
    const correctCount = parts.filter((part) => part.status === 'correct').length;
    const status: DayStatus = correctCount === parts.length
      ? 'done'
      : (attemptedCount > 0 ? 'active' : 'ready');
    const allAttempted = attemptedCount === parts.length;

    let target: QuestTarget;
    if (!farmAttempted) {
      target = {
        stepIndex: 0, mode: 'play'
      };
    } else if (allAttempted) {
      target = {
        stepIndex: stepIndexByQuestionId.get(questions[0].id)!, mode: 'review'
      };
    } else {
      const firstUnattempted = questions.find((question) => {
        const progress = progressByQuestionId.get(question.id);
        return !progress || progress.isCorrect === null;
      }) ?? questions[0];
      target = {
        stepIndex: stepIndexByQuestionId.get(firstUnattempted.id)!, mode: 'play'
      };
    }

    const label = categoryLabels[category];
    days.push({
      key: `category-${category}`,
      title: label,
      blurb: questions.length > 1
        ? `Answer all ${questions.length} questions about this profile's ${label.toLowerCase()}.`
        : `Answer the question about this profile's ${label.toLowerCase()}.`,
      status,
      parts,
      target
    });
  }

  // Reuses hasFinished (every question attempted, not necessarily correct)
  // rather than a locally-recomputed notion of "finished" — same predicate
  // that gated the old Trophy/"Summary" row.
  const finished = hasFinished(farm);
  days.push({
    key: 'summary',
    title: 'Harvest',
    blurb: finished
      ? 'See how the season went and claim your harvest score.'
      : 'Finish every day above to see your harvest score.',
    status: finished ? 'done' : 'unavailable',
    parts: [],
    target: finished ? {
      stepIndex: monolith.questions.length, mode: 'play'
    } : null
  });

  return days;
}
