import { userRepository } from '../repositories/user.repository';
import { userStatsRepository } from '../repositories/user-stats.repository';
import { levelRepository } from '../repositories/level.repository';
import { attemptRepository } from '../repositories/attempt.repository';
import type { AttemptResult } from '@shared/api/models/attempt.model';
import type { AuthenticatedUser } from '../middleware/auth.middleware';

const POINTS_PER_CORRECT_ANSWER = 10;
const PASSING_SCORE_PERCENT = 75;

export class AttemptService {

  public async submitAttempt(
    claims: AuthenticatedUser,
    questionId: number,
    selectedOptionId: number,
    questionShownAt: string
  ): Promise<AttemptResult> {
    const user = await userRepository.findBySupabaseId(claims.sub);
    if (!user) {
      throw new Error('User not found; sync the user before submitting an attempt');
    }

    const question = await attemptRepository.findQuestionContext(questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    const selectedOption = question.options.find((option) => option.id === selectedOptionId);
    if (!selectedOption) {
      throw new Error('selectedOptionId does not belong to this question');
    }

    const currentLevelNumber = await userStatsRepository.findCurrentLevelNumber(user.id);

    const isCorrect = selectedOption.isCorrect;
    await attemptRepository.create({
      userId: user.id,
      questionId,
      selectedOptionId,
      isCorrect,
      pointsEarned: isCorrect ? POINTS_PER_CORRECT_ANSWER : 0,
      questionShownAt: new Date(questionShownAt)
    });

    // Levels are all playable in any order, so currentLevelId is no longer a
    // gate — it's the user's furthest-reached level, which surfaces as their
    // rank (UserStats.rank comes from this level's title). It therefore only
    // ever moves forward: replaying an earlier level can't pull the rank back
    // down, but passing a later one out of order does push it up.
    if (question.levelNumber >= currentLevelNumber) {
      const scorePercent = await levelRepository.findScoreForLevel(question.levelId, user.id);
      if (scorePercent >= PASSING_SCORE_PERCENT) {
        const nextLevel = await levelRepository.findByLevelNumber(question.levelNumber + 1);
        if (nextLevel) {
          await userStatsRepository.advanceCurrentLevel(user.id, nextLevel.id);
        }
      }
    }

    return { isCorrect };
  }

}

export const attemptService = new AttemptService();
