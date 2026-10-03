"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { tokenStorage } from "@/src/share/api/tokenStorage";
import { UsersApiService } from "@/src/share/api/UsersApiService";
import { IQueryError } from "@/src/share/api/model/api";
import { avatarUrl } from "@/src/share/lib/avatar";
import { IUserRes } from "@/src/share/api/model/users";
import type { IPayload } from "@/src/share/types/token";

const usersApi = new UsersApiService();

export interface IUseCurrentUser {
  /** Decoded access token, or null when signed out. */
  payload: IPayload | null;
  user: IUserRes | undefined;
  /** True while the profile request is in flight. */
  isLoadingProfile: boolean;
  /** Safe to render: the username, or a neutral placeholder. */
  initial: string;
  username: string;
  /**
   * The signed-in member's avatar URL, or null when they have not set one.
   *
   * Null is a real answer rather than "not known yet", so a caller renders the
   * initials fallback without having to wait. /me is the only endpoint that
   * reports avatar state for the current user.
   */
  avatarUrl: string | null;
}

/**
 * Loads the signed-in user's profile and reacts to a session that is no longer
 * usable.
 *
 * `GET /me` answers 401 for an expired session and 403 for a blocked account.
 * The axios interceptor only recovers from 401 by refreshing, so without this a
 * blocked user would sit on a page whose profile request keeps failing. Any
 * rejected profile therefore clears the tokens and sends them to the login
 * page, where signing in again reports the block.
 */
export const useCurrentUser = (): IUseCurrentUser => {
  const router = useRouter();
  const [payload, setPayload] = useState<IPayload | null>(null);

  useEffect(() => {
    setPayload(tokenStorage.getPayload());
  }, []);

  const { data, error, isPending, isFetching } = useQuery<
    IUserRes,
    AxiosError<IQueryError>
  >({
    queryKey: ["getMe"],
    queryFn: () => usersApi.getMe(),
    enabled: Boolean(payload),
  });

  const status = error?.response?.status;
  const sessionRejected = status === 401 || status === 403;

  useEffect(() => {
    if (!sessionRejected) {
      return;
    }

    tokenStorage.clearTokens();
    // Navigating away unmounts the navbar, so the stale payload above no
    // longer matters and no extra state update is needed.
    router.replace("/auth/login");
  }, [sessionRejected, router]);

  const username = data?.username ?? "";

  return {
    payload,
    user: data,
    // A disabled query is still "pending", so require the token to be read too.
    isLoadingProfile: Boolean(payload) && isPending && isFetching,
    initial: username ? username.charAt(0).toUpperCase() : "?",
    username,
    // Resolved once here rather than re-derived at each call site, so "does this
    // member have a picture, and where does it live" is a single rule.
    avatarUrl: data
      ? avatarUrl(data.id, data.hasAvatar, data.avatarUpdatedAt)
      : null,
  };
};
