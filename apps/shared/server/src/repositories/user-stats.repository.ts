import { getPrismaClient } from '../config/prisma';
import type { QuestionCategory } from '@shared/api/models/monolith.model';

export interface CategoryAccuracyRow {
  category: QuestionCategory;
  correct: number;
  attempted: number;
  accuracyPercent: number | null;
}

// Schema declaration order (see the QuestionCategory enum in schema.prisma) —
// used to return categories in a stable, predictable order rather than
// whatever order the DB happens to hand back questions in.
const CATEGORY_ORDER: QuestionCategory[] = [
  'DIAGNOSTIC_HORIZONS', 'SOIL_FORM', 'SOIL_FAMILY_CODE', 'LANDSCAPE_POSITION', 'SUITABILITY'
];

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

  public async incrementTotalXp(userId: number, amount: number): Promise<void> {
    await getPrismaClient().userGameStat.update({
      where: { userId },
      data: { totalXp: { increment: amount } }
    });
  }

  // Bucketed by each question's *latest* attempt only — matching
  // level.repository.ts's findAllWithUserProgress semantics, where a
  // question retried until correct counts as correct, not as one wrong
  // attempt plus one right one. `take: 1` on the ordered nested relation
  // pushes "latest attempt per question" down to the DB rather than
  // fetching every attempt and reducing in JS.
  public async findCategoryAccuracyForUser(userId: number): Promise<CategoryAccuracyRow[]> {
    const questions = await getPrismaClient().question.findMany({
      select: {
        category: true,
        attempts: {
          where: { userId },
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: { isCorrect: true }
        }
      }
    });

    const buckets = new Map<QuestionCategory, { correct: number; attempted: number; }>();
    for (const question of questions) {
      const bucket = buckets.get(question.category) ?? {
        correct: 0, attempted: 0
      };
      const latestAttempt = question.attempts[0];
      if (latestAttempt) {
        bucket.attempted += 1;
        if (latestAttempt.isCorrect) bucket.correct += 1;
      }
      buckets.set(question.category, bucket);
    }

    return CATEGORY_ORDER
      .filter((category) => buckets.has(category))
      .map((category) => {
        const { correct, attempted } = buckets.get(category)!;
        return {
          category,
          correct,
          attempted,
          accuracyPercent: attempted > 0 ? Math.round((correct / attempted) * 100) : null
        };
      });
  }

}

export const userStatsRepository = new UserStatsRepository();
