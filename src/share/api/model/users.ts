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
   * The API always emits this, including when false -- a missing `isBlocked`
   * would leave the client guessing. Older servers omitted it, so treat absent
   * as false.
   */
  isBlocked?: boolean;
  /** Absent for accounts registered before email was collected. */
  email?: string;
  /** Join date as Unix epoch milliseconds. */
  createdAt?: number;
  /** Free text the member wrote about themselves. Empty when unset. */
  bio?: string;
  /**
   * Whether an avatar is set, and when it last changed (Unix ms, 0 when none).
   *
   * Both are always present on the current API. `hasAvatar` exists so the client
   * never has to infer "no avatar" from a missing field, and
   * `avatarUpdatedAt` is what makes the avatar URL cache-bust when it changes.
   */
  hasAvatar?: boolean;
  avatarUpdatedAt?: number;
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

/**
 * The complete desired profile, not a patch.
 *
 * Every field is sent on every save, because an empty field is how the API spells
 * "clear this" -- a client that omitted one instead would silently leave the
 * old value in place, and there would be no way to remove an email at all.
 */
export interface IUpdateUserReq {
  username: string;
  email: string;
  bio: string;
}

/**
 * What anyone may see about a member.
 *
 * A separate type from IUserRes on purpose. The public endpoint answers with
 * only these fields and never includes an address, so the type says so -- which
 * means a component cannot reach for `profile.email` and discover at runtime
 * that it is undefined. It is also why the client's user type is not reused
 * here: a shared type would invite exactly that.
 */
export interface IPublicProfile {
  id: string;
  username: string;
  bio?: string;
  createdAt?: number;
  hasAvatar?: boolean;
  avatarUpdatedAt?: number;
}
