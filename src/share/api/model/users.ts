import { ERole } from "../../types/token";

export interface IAuthRes {
  refreshToken: string;
  accessToken: string;
}

export interface IUserRes {
  id: string;
  username: string;
  role: ERole;
  /**
   * The API omits the field when the account is not blocked, so treat a
   * missing value as false.
   */
  isBlocked?: boolean;
  /** Absent for accounts registered before email was collected. */
  email?: string;
  /** Join date as Unix epoch milliseconds. */
  createdAt?: number;
}

export interface ILoginReq {
  username: string;
  password: string;
}

export interface IRegisterReq {
  username: string;
  password: string;
  email?: string;
}
