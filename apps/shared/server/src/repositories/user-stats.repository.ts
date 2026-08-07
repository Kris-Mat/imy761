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

  // The user's furthest-reached level. Every level is playable regardless of
  // this — it exists only so passing a level can push the rank forward.
  public async findCurrentLevelNumber(userId: number): Promise<number> {
    const gameStat = await getPrismaClient().userGameStat.findUnique({
      where: { userId },
      select: { level: { select: { levelNumber: true } } }
    });
    // No game stat yet (e.g. seeded before Level 1 existed) — treat them as
    // being on the first level.
    return gameStat?.level.levelNumber ?? 1;
  }

  public async advanceCurrentLevel(userId: number, nextLevelId: number): Promise<void> {
    await getPrismaClient().userGameStat.update({
      where: { userId },
      data: { currentLevelId: nextLevelId }
    });
  }

}

export const userStatsRepository = new UserStatsRepository();
