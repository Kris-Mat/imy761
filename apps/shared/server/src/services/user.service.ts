import { userRepository } from '../repositories/user.repository';
import { levelRepository } from '../repositories/level.repository';
import type { User, AvatarConfig } from '@shared/api/models/user.model';
import type { AuthenticatedUser } from '../middleware/auth.middleware';
import { HttpError } from '../lib/http-error';

export class UserService {

  public async getUsers(): Promise<User[]> {
    return userRepository.findAll();
  }

  public async syncFromSupabase(claims: AuthenticatedUser): Promise<User> {
    const existing = await userRepository.findBySupabaseId(claims.sub);
    if (existing) return existing;

    const meta = (claims.user_metadata ?? {}) as {
      username?: string;
      firstName?: string;
      lastName?: string;
    };
    const firstName = meta.firstName?.trim();
    const lastName = meta.lastName?.trim();
    if (!firstName || !lastName) {
      throw new Error('firstName and lastName are required to complete signup');
    }

    const user = await userRepository.createFromSupabase({
      supabaseId: claims.sub,
      email: claims.email ?? '',
      username: meta.username ?? (claims.email ? claims.email.split('@')[0] : claims.sub),
      firstName,
      lastName
    });

    // Best-effort: a new account should start at Level 1 so "Rank" isn't
    // stuck on "Unranked" forever. If no Level 1 is seeded yet, skip silently
    // rather than failing signup over it.
    const startingLevelId = await levelRepository.findStartingLevelId();
    if (startingLevelId) {
      await userRepository.createGameStat(user.id, startingLevelId);
    }

    return user;
  }

  public async updateDetails(claims: AuthenticatedUser, data: {
    username: string;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    const user = await userRepository.findBySupabaseId(claims.sub);
    if (!user) {
      throw new Error('User not found; sync the user before updating details');
    }
    return userRepository.updateDetails(user.id, data);
  }

  public async saveAvatarConfig(claims: AuthenticatedUser, avatarConfig: AvatarConfig): Promise<AvatarConfig> {
    const user = await userRepository.findBySupabaseId(claims.sub);
    if (!user) {
      throw new Error('User not found; sync the user before saving an avatar');
    }
    return userRepository.upsertAvatarConfig(user.id, avatarConfig);
  }

  // The JWT claims Supabase issues don't carry role (see AuthenticatedUser),
  // so admin-only endpoints must look the requester up in the DB on every
  // call rather than trusting anything in the token itself.
  public async requireAdmin(claims: AuthenticatedUser): Promise<User> {
    const user = await userRepository.findBySupabaseId(claims.sub);
    if (!user || user.role !== 'ADMIN') {
      throw new HttpError(403, 'Admin role required');
    }
    return user;
  }

}

export const userService = new UserService();
