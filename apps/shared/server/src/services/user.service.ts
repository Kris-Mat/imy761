import { userRepository } from '../repositories/user.repository';
import type { User } from '@shared/api/models/user.model';
import type { AuthenticatedUser } from '../middleware/auth.middleware';

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

    return userRepository.createFromSupabase({
      supabaseId: claims.sub,
      email: claims.email ?? '',
      username: meta.username ?? (claims.email ? claims.email.split('@')[0] : claims.sub),
      firstName,
      lastName
    });
  }

}

export const userService = new UserService();
