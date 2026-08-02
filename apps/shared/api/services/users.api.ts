import { BaseApi } from "./base.api";
import { type User, type AvatarConfig } from "../models/user.model";
import { type UserStats } from "../models/user-stats.model";
import { type FarmProgress } from "../models/farm.model";

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

  getMyStats(accessToken: string): Promise<UserStats> {
    return this.get<UserStats>(
      `users/me/stats`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }

  getMyFarms(accessToken: string): Promise<FarmProgress[]> {
    return this.get<FarmProgress[]>(
      `users/me/farms`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }

  saveMyAvatar(accessToken: string, avatarConfig: AvatarConfig): Promise<AvatarConfig> {
    return this.put<AvatarConfig>(
      `users/me/avatar`,
      { avatarConfig },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }
}

export const userApi = new UsersApi();
