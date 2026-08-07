import { getPrismaClient } from '../config/prisma';
import type { FarmProgress } from '@shared/api/models/farm.model';

const withAttemptsForUser = (userId: number) => ({
  select: {
    id: true,
    attempts: {
      where: { userId },
      orderBy: { startedAt: 'desc' as const },
      select: {
        isCorrect: true, selectedOptionId: true
      }
    }
  }
});

export class LevelRepository {

  public async findAllWithUserProgress(userId: number): Promise<FarmProgress[]> {
    const levels = await getPrismaClient().level.findMany({
      orderBy: { levelNumber: 'asc' },
      select: {
        id: true,
        levelNumber: true,
        title: true,
        farmerName: true,
        soilFamilyCode: {
          select: {
            monolith: {
              select: { questions: withAttemptsForUser(userId) }
            }
          }
        }
      }
    });

    return levels.map((level) => {
      const { questions } = level.soilFamilyCode.monolith;
      // attempts is ordered newest-first, so [0] is the latest — the one
      // that determines current right/wrong status and score. `.some()`
      // below (for `completed`) still looks across every attempt ever made.
      const latestByQuestion = questions.map((question) => question.attempts[0]);
      const attemptedCount = latestByQuestion.filter(Boolean).length;
      const correctCount = latestByQuestion.filter((attempt) => attempt?.isCorrect).length;

      return {
        id: level.id,
        name: level.title,
        farmerName: level.farmerName,
        orderIndex: level.levelNumber,
        visited: questions.some((question) => question.attempts.length > 0),
        completed: questions.length > 0 && questions.every((question) => question.attempts.some((attempt) => attempt.isCorrect)),
        scorePercent: attemptedCount > 0 ? Math.round((correctCount / questions.length) * 100) : null,
        questions: questions.map((question) => ({
          questionId: question.id,
          selectedOptionId: question.attempts[0]?.selectedOptionId ?? null,
          isCorrect: question.attempts[0]?.isCorrect ?? null
        }))
      };
    });
  }

  public async findStartingLevelId(): Promise<number | null> {
    const startingLevel = await getPrismaClient().level.findUnique({ where: { levelNumber: 1 } });
    return startingLevel?.id ?? null;
  }

  public async findByLevelNumber(levelNumber: number): Promise<{ id: number; } | null> {
    return getPrismaClient().level.findUnique({
      where: { levelNumber }, select: { id: true }
    });
  }

  // Recomputes a level's score fresh from the DB right after an attempt is
  // recorded, to decide whether it just crossed the passing threshold —
  // deliberately not reusing the FarmProgress list above since that would
  // mean re-fetching every level just to check one.
  public async findScoreForLevel(levelId: number, userId: number): Promise<number> {
    const level = await getPrismaClient().level.findUnique({
      where: { id: levelId },
      select: {
        soilFamilyCode: {
          select: {
            monolith: {
              select: { questions: withAttemptsForUser(userId) }
            }
          }
        }
      }
    });
    const questions = level?.soilFamilyCode.monolith.questions ?? [];
    if (questions.length === 0) return 0;
    const correctCount = questions.filter((question) => question.attempts[0]?.isCorrect).length;
    return Math.round((correctCount / questions.length) * 100);
  }

}

export const levelRepository = new LevelRepository();
