import { userRepository } from '../repositories/user.repository';
import { levelRepository } from '../repositories/level.repository';
import type { FarmProgress } from '@shared/api/models/farm.model';
import type { AuthenticatedUser } from '../middleware/auth.middleware';

export class FarmService {

  public async getFarmsForSupabaseUser(claims: AuthenticatedUser): Promise<FarmProgress[]> {
    const user = await userRepository.findBySupabaseId(claims.sub);
    if (!user) {
      throw new Error('User not found; sync the user before requesting farm progress');
    }
    return levelRepository.findAllWithUserProgress(user.id);
  }

}

export const farmService = new FarmService();
