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
        soilFamilyCode: {
          select: {
            monolith: {
              select: {
                questions: {
                  select: {
                    attempts: {
                      where: { userId },
                      select: { id: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    return levels.map((level) => ({
      id: level.id,
      name: level.title,
      orderIndex: level.levelNumber,
      visited: level.soilFamilyCode.monolith.questions.some((question) => question.attempts.length > 0)
    }));
  }

  public async findStartingLevelId(): Promise<number | null> {
    const startingLevel = await getPrismaClient().level.findUnique({ where: { levelNumber: 1 } });
    return startingLevel?.id ?? null;
  }

}

export const levelRepository = new LevelRepository();
