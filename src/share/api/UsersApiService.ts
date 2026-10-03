import { api } from ".";
import {
  IAuthRes,
  ILoginReq,
  IPublicProfile,
  IRegisterReq,
  IUpdateUserReq,
  IUserRes,
} from "./model/users";

/**
 * Longest avatar the API will store, in bytes. Matches the service's cap.
 *
 * The client downsamples to at most this size before uploading, so exceeding it
 * here means the chosen image is larger than the API can ever accept and the
 * upload would be rejected after a pointless round trip.
 */
export const MAX_AVATAR_BYTES = 512 * 1024;

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

  /**
   * Another member's public profile, readable while signed out.
   *
   * Public because a profile page is: its posts and comments are fetched from
   * public endpoints too, so gating this one would leave a public page
   * depending on a session.
   */
  async getPublicProfile(id: string): Promise<IPublicProfile> {
    return api
      .get<IPublicProfile>(`/profiles/${id}`)
      .then((res) => res.data);
  }

  /** Administrators only. */
  async list(): Promise<IUserRes[]> {
    return api.get<IUserRes[]>("/users").then((res) => res.data);
  }

  /**
   * Replaces the caller's editable profile.
   *
   * Sends all three fields every time. The API reads an absent field as "clear
   * this", so a partial payload would delete the fields it left out.
   */
  async updateMe(req: IUpdateUserReq): Promise<IUserRes> {
    return api.put<IUserRes>("/users", req).then((res) => res.data);
  }

  /**
   * Uploads the caller's avatar as a raw body rather than multipart form data.
   *
   * Raw because there is exactly one binary and no accompanying fields to send,
   * so multipart would add a parser and a boundary format to express nothing.
   *
   * `Content-Type` is set to what the bytes actually are rather than what the
   * file was named. The API sniffs the content itself and ignores this header,
   * but sending something honest keeps the request readable in a network log.
   */
  async setAvatar(data: ArrayBuffer, contentType: string): Promise<IUserRes> {
    return api
      .put<IUserRes>("/users/avatar", data, {
        headers: { "Content-Type": contentType },
      })
      .then((res) => res.data);
  }

  async removeAvatar(): Promise<IUserRes> {
    return api.delete<IUserRes>("/users/avatar").then((res) => res.data);
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
