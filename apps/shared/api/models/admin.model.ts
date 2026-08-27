import type { QuestionCategory } from './monolith.model';

export interface StudentQuestionStat {
  questionId: number;
  category: QuestionCategory;
  prompt: string;
  // Total submitted attempts on this question (retries included).
  attempts: number;
  retryCount: number;
  // Correctness of the student's most recent attempt on this question.
  correct: boolean;
  // Derived from the most recent attempt's questionShownAt -> completedAt;
  // null if that attempt has no completedAt (should not happen once every
  // attempt is written through attemptService.submitAttempt).
  timeTakenSeconds: number | null;
}

export interface StudentAnalytics {
  userId: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  questions: StudentQuestionStat[];
}
