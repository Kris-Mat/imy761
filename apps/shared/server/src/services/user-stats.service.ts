import { userRepository } from '../repositories/user.repository';
import { userStatsRepository } from '../repositories/user-stats.repository';
import type { UserStats } from '@shared/api/models/user-stats.model';
import type { AuthenticatedUser } from '../middleware/auth.middleware';

function toDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Consecutive-day streak ending today: counts backward from today while each
// day has at least one completed attempt, stopping at the first gap.
function calculateStreak(completedAtDates: Date[]): number {
  const daysWithActivity = new Set(completedAtDates.map(toDayKey));

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (daysWithActivity.has(toDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export class UserStatsService {

  public async getStatsForSupabaseUser(claims: AuthenticatedUser): Promise<UserStats> {
    const user = await userRepository.findBySupabaseId(claims.sub);
    if (!user) {
      throw new Error('User not found; sync the user before requesting stats');
    }

    const [gameStat, tasksCompleted, correctAnswers, completedAtDates, badgesEarned] = await Promise.all([
      userStatsRepository.findGameStat(user.id),
      userStatsRepository.countCompletedAttempts(user.id),
      userStatsRepository.countCorrectAttempts(user.id),
      userStatsRepository.findCompletedAttemptDates(user.id),
      userStatsRepository.countAchievements(user.id)
    ]);

    return {
      totalXp: gameStat?.totalXp ?? 0,
      rank: gameStat?.levelTitle ?? null,
      tasksCompleted,
      correctAnswers,
      currentStreak: calculateStreak(completedAtDates),
      badgesEarned
    };
  }

}

export const userStatsService = new UserStatsService();
