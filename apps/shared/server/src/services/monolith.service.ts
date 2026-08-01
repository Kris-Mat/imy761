import { monolithRepository } from '../repositories/monolith.repository';
import type { Monolith } from '@shared/api/models/monolith.model';

export class MonolithService {

  public async getMonoliths(): Promise<Monolith[]> {
    return monolithRepository.findAll();
  }

}

export const monolithService = new MonolithService();
