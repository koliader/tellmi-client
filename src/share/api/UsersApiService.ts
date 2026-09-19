import { api } from ".";
import { IAuthRes, ILoginReq, IRegisterReq, IUserRes } from "./model/users";

export class UsersApiService {
  async login(req: ILoginReq): Promise<IAuthRes> {
    console.log(req);
    return api.post<IAuthRes>("/auth/login", req).then((res) => res.data);
  }

  async register(req: IRegisterReq): Promise<IAuthRes> {
    return api.post<IAuthRes>("/auth/register", req).then((res) => res.data);
  }

  async getMe(): Promise<IUserRes> {
    return api.get<IUserRes>("/me").then((res) => res.data);
  }
}
