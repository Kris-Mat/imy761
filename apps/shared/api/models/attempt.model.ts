import type { Achievement } from './achievement.model';

export interface SubmitAttemptRequest {
  questionId: number;
  selectedOptionId: number;
  // ISO timestamp captured on the client when the question was first shown,
  // used as the attempt's startedAt so time-on-task reflects how long the
  // student actually spent rather than the near-zero gap to submit-time.
  questionShownAt: string;
}

export interface QuestionAttemptStatus {
  questionId: number;
  isCorrect: boolean;
}

export interface AttemptResult {
  isCorrect: boolean;
  // True exactly when this attempt pushed the user's rank forward to a new
  // level (see AttemptService.submitAttempt) — a separate celebration moment
  // from newlyUnlockedAchievements below, which can fire independently of it.
  leveledUp: boolean;
  // Empty if nothing was newly unlocked on this attempt. Achievements can be
  // awarded on any attempt (e.g. FIRST_ATTEMPT on the very first one), not
  // just a quest-completing one, so this is populated on every submitAttempt
  // call, not just the last question of a level.
  newlyUnlockedAchievements: Achievement[];
}
