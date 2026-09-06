import { getPrismaClient } from '../config/prisma';

export interface AchievementMasterRow {
  id: number;
  title: string;
  description: string;
  criteriaCode: string;
}

export class AchievementRepository {

  public async findAllMaster(): Promise<AchievementMasterRow[]> {
    return getPrismaClient().achievementMaster.findMany({ orderBy: { id: 'asc' } });
  }

  public async findByCriteriaCodes(criteriaCodes: string[]): Promise<AchievementMasterRow[]> {
    return getPrismaClient().achievementMaster.findMany({
      where: { criteriaCode: { in: criteriaCodes } }
    });
  }

  // Keyed by achievementId so callers can look up whether/when a given
  // AchievementMaster row has been earned by this user.
  public async findEarnedByUser(userId: number): Promise<Map<number, Date>> {
    const rows = await getPrismaClient().userAchievement.findMany({
      where: { userId },
      select: {
        achievementId: true, earnedAt: true
      }
    });
    return new Map(rows.map((row) => [row.achievementId, row.earnedAt]));
  }

  // Relies on the @@unique([userId, achievementId]) constraint to stay
  // idempotent — awarding an already-earned achievement is a no-op.
  public async awardIfNotEarned(userId: number, achievementId: number): Promise<void> {
    await getPrismaClient().userAchievement.upsert({
      where: { userId_achievementId: {
        userId, achievementId 
      } },
      update: {},
      create: {
        userId, achievementId
      }
    });
  }

}

export const achievementRepository = new AchievementRepository();
