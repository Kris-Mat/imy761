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
}
