import { api } from ".";
import {
  IAuthRes,
  ILoginReq,
  IRegisterReq,
  IUserRes,
} from "./model/users";

export class UsersApiService {
  async login(req: ILoginReq): Promise<IAuthRes> {
    return api.post<IAuthRes>("/auth/login", req).then((res) => res.data);
  }

  async register(req: IRegisterReq): Promise<IAuthRes> {
    return api.post<IAuthRes>("/auth/register", req).then((res) => res.data);
  }

  async getMe(): Promise<IUserRes> {
    return api.get<IUserRes>("/me").then((res) => res.data);
  }

  /** Administrators only. */
  async list(): Promise<IUserRes[]> {
    return api.get<IUserRes[]>("/users").then((res) => res.data);
  }

  /** Administrators only. Blocking also revokes the account's sessions. */
  async setBlocked(
    id: string,
    isBlocked: boolean,
  ): Promise<IUserRes> {
    const action = isBlocked ? "block" : "unblock";
    return api
      .patch<IUserRes>(`/users/${id}/${action}`)
      .then((res) => res.data);
  }
}
