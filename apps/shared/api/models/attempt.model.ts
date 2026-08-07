export interface SubmitAttemptRequest {
  questionId: number;
  selectedOptionId: number;
}

export interface AttemptResult {
  isCorrect: boolean;
}
