import { BaseApi } from "./base.api";
import { type Monolith } from "../models/monolith.model";

class MonolithsApi extends BaseApi {
  getMonoliths(): Promise<Monolith[]> {
    return this.get<Monolith[]>(
      `monoliths`
    );
  }
}

export const monolithsApi = new MonolithsApi();
