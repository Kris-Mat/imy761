export interface SubmitAttemptRequest {
  questionId: number;
  selectedOptionId: number;
  // ISO timestamp captured on the client when the question was first shown,
  // used as the attempt's startedAt so time-on-task reflects how long the
  // student actually spent rather than the near-zero gap to submit-time.
  questionShownAt: string;
}

export interface AttemptResult {
  isCorrect: boolean;
}
