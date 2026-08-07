import type { FarmProgress } from '@shared/api/models/farm.model';

// A question with a null isCorrect has never been attempted (see
// FarmQuestionProgress) — these two predicates drive which of Start / Retry /
// Review Answers a quest offers.

// At least one answer submitted: the quest is no longer a first run, so its
// primary action becomes "Retry Quest" rather than "Start Quest".
export function hasAttempted(farm: FarmProgress): boolean {
  return farm.questions.some((question) => question.isCorrect !== null);
}

// Every question answered, so there is a full set of answers worth reviewing.
// Deliberately not `farm.completed`, which means "eventually got every question
// right" — a user who finished a pass with wrong answers still has a pass to
// review.
export function hasFinished(farm: FarmProgress): boolean {
  return farm.questions.length > 0 && farm.questions.every((question) => question.isCorrect !== null);
}
