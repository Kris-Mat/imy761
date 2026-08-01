import { getPrismaClient } from '../config/prisma';
import type { Monolith } from '@shared/api/models/monolith.model';

export class MonolithRepository {

  public async findAll(): Promise<Monolith[]> {
    return getPrismaClient().monolith.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        horizons: {
          orderBy: { orderIndex: 'asc' },
          include: {
            characteristics: { orderBy: { orderIndex: 'asc' } }
          }
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            options: { orderBy: { orderIndex: 'asc' } }
          }
        },
        soilFamilyCode: {
          include: {
            fields: { orderBy: { orderIndex: 'asc' } }
          }
        }
      }
    });
  }

}

export const monolithRepository = new MonolithRepository();
