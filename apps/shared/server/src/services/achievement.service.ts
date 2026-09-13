import { userRepository } from '../repositories/user.repository';
import { achievementRepository } from '../repositories/achievement.repository';
import { levelRepository } from '../repositories/level.repository';
import { attemptRepository } from '../repositories/attempt.repository';
import type { Achievement } from '@shared/api/models/achievement.model';
import type { AuthenticatedUser } from '../middleware/auth.middleware';

// Everything the caller already knows about the attempt just recorded, so
// this service doesn't have to re-derive data attempt.service.ts computed
// for its own level-up check.
export interface AttemptAchievementContext {
  userId: number;
  levelId: number;
  scorePercent: number;
  passedThreshold: boolean;
  leveledUp: boolean;
  isFirstAttemptEver: boolean;
}

export class AchievementService {

  public async getAchievementsForSupabaseUser(claims: AuthenticatedUser): Promise<Achievement[]> {
    const user = await userRepository.findBySupabaseId(claims.sub);
    if (!user) {
      throw new Error('User not found; sync the user before requesting achievements');
    }

    const [masters, earnedByAchievementId] = await Promise.all([
      achievementRepository.findAllMaster(),
      achievementRepository.findEarnedByUser(user.id)
    ]);

    return masters.map((master): Achievement => {
      const earnedAt = earnedByAchievementId.get(master.id);
      return {
        id: master.id,
        title: master.title,
        description: master.description,
        earned: earnedAt !== undefined,
        earnedAt: earnedAt ? earnedAt.toISOString() : null
      };
    });
  }

  // Returns only the achievements this call actually newly unlocked (not
  // ones that were already earned and just got re-awarded as a no-op) —
  // that's what the caller needs to drive an unlock celebration.
  public async evaluateAndAward(context: AttemptAchievementContext): Promise<Achievement[]> {
    const metCriteriaCodes: string[] = [];

    if (context.isFirstAttemptEver) metCriteriaCodes.push('FIRST_ATTEMPT');
    if (context.scorePercent === 100) metCriteriaCodes.push('PERFECT_LEVEL');
    if (context.leveledUp) metCriteriaCodes.push('LEVEL_UP');

    if (context.passedThreshold && await this.passedWithoutAnyRetries(context.userId, context.levelId)) {
      metCriteriaCodes.push('NO_RETRY_PASS');
    }

    if (await this.hasCompletedEveryLevel(context.userId)) {
      metCriteriaCodes.push('MASTER_FARMER');
    }

    if (metCriteriaCodes.length === 0) return [];

    const [matchingAchievements, earnedByAchievementId] = await Promise.all([
      achievementRepository.findByCriteriaCodes(metCriteriaCodes),
      achievementRepository.findEarnedByUser(context.userId)
    ]);
    const newlyUnlocked = matchingAchievements.filter((achievement) => !earnedByAchievementId.has(achievement.id));

    await Promise.all(
      matchingAchievements.map((achievement) => achievementRepository.awardIfNotEarned(context.userId, achievement.id))
    );

    const awardedAt = new Date().toISOString();
    return newlyUnlocked.map((achievement): Achievement => ({
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      earned: true,
      earnedAt: awardedAt
    }));
  }

  private async passedWithoutAnyRetries(userId: number, levelId: number): Promise<boolean> {
    const questionIds = await levelRepository.findQuestionIdsForLevel(levelId);
    if (questionIds.length === 0) return false;

    const attemptCounts = await attemptRepository.countAttemptsPerQuestion(userId, questionIds);
    return questionIds.every((questionId) => attemptCounts.get(questionId) === 1);
  }

  private async hasCompletedEveryLevel(userId: number): Promise<boolean> {
    const levels = await levelRepository.findAllWithUserProgress(userId);
    return levels.length > 0 && levels.every((level) => level.completed);
  }

}

export const achievementService = new AchievementService();
