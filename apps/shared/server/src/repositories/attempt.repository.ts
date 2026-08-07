import { getPrismaClient } from '../config/prisma';

export interface QuestionAttemptContext {
  id: number;
  options: { id: number; isCorrect: boolean; }[];
  levelId: number;
  levelNumber: number;
}

export class AttemptRepository {

  public async findQuestionContext(questionId: number): Promise<QuestionAttemptContext | null> {
    const question = await getPrismaClient().question.findUnique({
      where: { id: questionId },
      select: {
        id: true,
        options: { select: {
          id: true, isCorrect: true 
        } },
        monolith: {
          select: {
            soilFamilyCode: {
              select: { level: { select: {
                id: true, levelNumber: true 
              } } }
            }
          }
        }
      }
    });
    const level = question?.monolith.soilFamilyCode?.level;
    if (!question || !level) return null;

    return {
      id: question.id,
      options: question.options,
      levelId: level.id,
      levelNumber: level.levelNumber
    };
  }

  public async create(data: {
    userId: number;
    questionId: number;
    selectedOptionId: number;
    isCorrect: boolean;
    pointsEarned: number;
  }): Promise<void> {
    await getPrismaClient().userAttempt.create({
      data: {
        ...data,
        completedAt: new Date()
      }
    });
  }

}

export const attemptRepository = new AttemptRepository();
