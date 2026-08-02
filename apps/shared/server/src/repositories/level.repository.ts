import { getPrismaClient } from '../config/prisma';
import type { FarmProgress } from '@shared/api/models/farm.model';

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
              select: {
                questions: {
                  select: {
                    attempts: {
                      where: { userId },
                      select: {
                        id: true, isCorrect: true 
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    return levels.map((level) => {
      const { questions } = level.soilFamilyCode.monolith;
      return {
        id: level.id,
        name: level.title,
        farmerName: level.farmerName,
        orderIndex: level.levelNumber,
        visited: questions.some((question) => question.attempts.length > 0),
        completed: questions.length > 0 && questions.every((question) => question.attempts.some((attempt) => attempt.isCorrect))
      };
    });
  }

  public async findStartingLevelId(): Promise<number | null> {
    const startingLevel = await getPrismaClient().level.findUnique({ where: { levelNumber: 1 } });
    return startingLevel?.id ?? null;
  }

}

export const levelRepository = new LevelRepository();
