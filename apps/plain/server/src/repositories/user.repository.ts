import { getUsers } from '@dataconnect/admin-generated';
import { getDataConnectClient } from '@plain-server/config/dataconnect';
import type { User } from '@shared/api/models/user.model';

export class UserRepository {

  public async findAll(): Promise<User[]> {
    const { data } = await getUsers(getDataConnectClient());
    return data.users;
  }

}

export const userRepository = new UserRepository();
