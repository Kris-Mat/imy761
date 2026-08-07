// Per-question status derived from the user's latest attempt on that
// question — null fields mean the question has never been attempted.
export interface FarmQuestionProgress {
  questionId: number;
  selectedOptionId: number | null;
  isCorrect: boolean | null;
}

export interface FarmProgress {
  id: number;
  name: string;
  farmerName: string;
  orderIndex: number;
  visited: boolean;
  // True once every question in the level's monolith has at least one
  // correct attempt from the user — distinct from `visited`, which only
  // requires a single attempt on any question.
  completed: boolean;
  // True once the level's questions have latest-attempt correctness of at
  // least the passing threshold; null if never attempted.
  scorePercent: number | null;
  // Keyed by questionId (not position) — used to decide whether a quest has
  // been attempted/finished, and to redraw each answer in review mode.
  questions: FarmQuestionProgress[];
}
