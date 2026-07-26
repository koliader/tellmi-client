import { api } from ".";
import { IAuthRes, ILoginReq } from "./model/users";

export class UsersApiService {
  async login(req: ILoginReq): Promise<IAuthRes> {
    return api.post<IAuthRes>("/auth/login", req).then((res) => res.data);
  }
}
