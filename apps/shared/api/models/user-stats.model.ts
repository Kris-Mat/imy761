import type { QuestionCategory } from './monolith.model';

export interface CategoryAccuracy {
  category: QuestionCategory;
  correct: number;
  attempted: number;
  // null if the category has never been attempted.
  accuracyPercent: number | null;
}

export interface UserStats {
  totalXp: number;
  rank: string | null;
  tasksCompleted: number;
  correctAnswers: number;
  currentStreak: number;
  badgesEarned: number;
  categoryAccuracy: CategoryAccuracy[];
}
