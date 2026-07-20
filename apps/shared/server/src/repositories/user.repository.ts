import { getPrismaClient } from '../config/prisma';
import type { User } from '@shared/api/models/user.model';

export class UserRepository {

  public async findAll(): Promise<User[]> {
    return getPrismaClient().user.findMany();
  }

}

export const userRepository = new UserRepository();
