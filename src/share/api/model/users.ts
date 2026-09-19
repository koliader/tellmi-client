import { ERole } from "../../types/token";

export interface IAuthRes {
  refreshToken: string;
  accessToken: string;
}

export interface IUserRes {
  id: string;
  username: string;
  role: ERole;
}

export interface ILoginReq {
  username: string;
  password: string;
}

export interface IRegisterReq {
  username: string;
  password: string;
}
