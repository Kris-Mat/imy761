import type { QuestionCategory } from '@shared/api/models/monolith.model';
import { getPrismaClient } from '../config/prisma';

export interface QuestionAttemptContext {
  id: number;
  options: { id: number; isCorrect: boolean; }[];
  levelId: number;
  levelNumber: number;
}

export interface StudentAttemptRow {
  userId: number;
  questionId: number;
  isCorrect: boolean;
  startedAt: Date;
  completedAt: Date | null;
  question: {
    prompt: string;
    category: QuestionCategory;
  };
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
    questionShownAt: Date;
  }): Promise<void> {
    const { questionShownAt, ...rest } = data;
    await getPrismaClient().userAttempt.create({
      data: {
        ...rest,
        startedAt: questionShownAt,
        completedAt: new Date()
      }
    });
  }

  // Every attempt (including retries — there is no unique constraint on
  // userId+questionId, see the model comment) for every USER-role account,
  // oldest first so callers can take the last entry per question as the
  // student's current/most-recent answer. Used only by the admin analytics
  // view, so it's fine to pull the whole table rather than paginating.
  public async findAllForStudents(): Promise<StudentAttemptRow[]> {
    return getPrismaClient().userAttempt.findMany({
      where: { user: { role: 'USER' } },
      orderBy: { startedAt: 'asc' },
      select: {
        userId: true,
        questionId: true,
        isCorrect: true,
        startedAt: true,
        completedAt: true,
        question: { select: {
          prompt: true, category: true
        } }
      }
    });
  }

}

export const attemptRepository = new AttemptRepository();
