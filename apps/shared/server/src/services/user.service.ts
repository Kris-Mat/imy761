import { userRepository } from '../repositories/user.repository';
import type { User } from '@shared/api/models/user.model';

export class UserService {

  public async getUsers(): Promise<User[]> {
    return userRepository.findAll();
  }

}

export const userService = new UserService();
