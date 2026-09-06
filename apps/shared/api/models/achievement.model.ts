export interface Achievement {
  id: number;
  title: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
}
