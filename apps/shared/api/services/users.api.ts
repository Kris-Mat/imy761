import { BaseApi } from "./base.api";
import { type User } from "../models/user.model";

class UsersApi extends BaseApi {
  getUsers(): Promise<User[]> {
    return this.get<User[]>(
      `users`
    );
  }
}

export const userApi = new UsersApi();
