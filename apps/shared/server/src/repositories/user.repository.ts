import { getPrismaClient } from '../config/prisma';
import type { User } from '@shared/api/models/user.model';

export class UserRepository {

  public async findAll(): Promise<User[]> {
    return getPrismaClient().user.findMany();
  }

  public async findBySupabaseId(supabaseId: string): Promise<User | null> {
    return getPrismaClient().user.findUnique({ where: { supabaseId } });
  }

  public async createFromSupabase(data: {
    supabaseId: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    return getPrismaClient().user.create({ data });
  }

  public async createGameStat(userId: number, levelId: number): Promise<void> {
    await getPrismaClient().userGameStat.create({
      data: {
        userId, totalXp: 0, currentLevelId: levelId
      }
    });
  }

}

export const userRepository = new UserRepository();
