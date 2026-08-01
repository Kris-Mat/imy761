import { BaseApi } from "./base.api";
import { type User } from "../models/user.model";

class UsersApi extends BaseApi {
  getUsers(accessToken: string): Promise<User[]> {
    return this.get<User[]>(
      `users`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }

  syncUser(accessToken: string): Promise<User> {
    return this.post<User>(
      `users/sync`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }
}

export const userApi = new UsersApi();
