import { getPrismaClient } from '../config/prisma';

export class UserStatsRepository {

  public async findGameStat(userId: number): Promise<{ totalXp: number; levelTitle: string; } | null> {
    const gameStat = await getPrismaClient().userGameStat.findUnique({
      where: { userId },
      include: { level: true }
    });
    if (!gameStat) return null;
    return {
      totalXp: gameStat.totalXp,
      levelTitle: gameStat.level.title
    };
  }

  public async countCompletedAttempts(userId: number): Promise<number> {
    return getPrismaClient().userAttempt.count({
      where: {
        userId, completedAt: { not: null }
      }
    });
  }

  public async countCorrectAttempts(userId: number): Promise<number> {
    return getPrismaClient().userAttempt.count({
      where: {
        userId, isCorrect: true
      }
    });
  }

  public async findCompletedAttemptDates(userId: number): Promise<Date[]> {
    const attempts = await getPrismaClient().userAttempt.findMany({
      where: {
        userId, completedAt: { not: null }
      },
      select: { completedAt: true }
    });
    return attempts.map((attempt) => attempt.completedAt!);
  }

  public async countAchievements(userId: number): Promise<number> {
    return getPrismaClient().userAchievement.count({ where: { userId } });
  }

}

export const userStatsRepository = new UserStatsRepository();
