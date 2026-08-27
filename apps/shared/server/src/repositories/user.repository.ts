import { Prisma } from '@prisma/client';
import { getPrismaClient } from '../config/prisma';
import type { User, AvatarConfig, Role } from '@shared/api/models/user.model';

const withPersonalisation = { personalisation: true } as const;

type UserRow = Prisma.UserGetPayload<{ include: typeof withPersonalisation; }>;

function toUser(row: UserRow): User {
  return {
    id: row.id,
    supabaseId: row.supabaseId,
    username: row.username,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    role: row.role,
    avatarConfig: (row.personalisation?.avatarConfig as AvatarConfig | undefined) ?? null
  };
}

export class UserRepository {

  public async findAll(filter?: { role?: Role; }): Promise<User[]> {
    const rows = await getPrismaClient().user.findMany({
      where: filter?.role ? { role: filter.role } : undefined,
      include: withPersonalisation
    });
    return rows.map(toUser);
  }

  public async findBySupabaseId(supabaseId: string): Promise<User | null> {
    const row = await getPrismaClient().user.findUnique({
      where: { supabaseId }, include: withPersonalisation
    });
    return row ? toUser(row) : null;
  }

  public async createFromSupabase(data: {
    supabaseId: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const row = await getPrismaClient().user.create({
      data, include: withPersonalisation
    });
    return toUser(row);
  }

  public async createGameStat(userId: number, levelId: number): Promise<void> {
    await getPrismaClient().userGameStat.create({
      data: {
        userId, totalXp: 0, currentLevelId: levelId
      }
    });
  }

  public async updateDetails(userId: number, data: {
    username: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const row = await getPrismaClient().user.update({
      where: { id: userId },
      data,
      include: withPersonalisation
    });
    return toUser(row);
  }

  public async upsertAvatarConfig(userId: number, avatarConfig: AvatarConfig): Promise<AvatarConfig> {
    const row = await getPrismaClient().userPersonalisation.upsert({
      where: { userId },
      update: { avatarConfig },
      create: {
        userId, avatarConfig
      }
    });
    return row.avatarConfig as AvatarConfig;
  }

}

export const userRepository = new UserRepository();
