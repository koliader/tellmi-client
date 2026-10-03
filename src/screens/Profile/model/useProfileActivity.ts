"use client";

import { useCallback, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { PostsApiService } from "@/src/share/api/PostsApiService";
import { CommentsApiService } from "@/src/share/api/CommentsApiService";
import { IQueryError } from "@/src/share/api/model/api";
import { ICommentRow } from "@/src/share/api/model/comments";
import { IPostRow } from "@/src/share/api/model/posts";

/**
 * Posts per page in each tab.
 *
 * Paged rather than fetched whole, because a long-standing member can have
 * hundreds of either and a profile that renders all of them makes the page
 * itself the slow thing. 20 matches the feed's own page size.
 */
const PAGE_SIZE = 20;

/** The two tabs a profile offers. */
export type ActivityTab = "posts" | "comments";

export interface ActivityResult<T> {
  rows: T[];
  /**
   * How many exist in total. Zero is a real answer -- a member who has only ever
   * read is exactly who a profile is often opened for -- and the API sends it
   * explicitly rather than omitting it, so it is never mistaken for "unknown".
   */
  totalCount: number;
  offset: number;
  isLoading: boolean;
  /** True while a further page is in flight, with the old rows still shown. */
  isFetching: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
}

const describe = (error: unknown): string => {
  const message = (error as AxiosError<IQueryError>)?.response?.data?.error;
  return typeof message === "string" && message.length > 0
    ? message
    : "Could not load this. Please try again.";
};

/**
 * One member's posts, newest first.
 *
 * Exposed separately from the comments tab rather than as one function returning
 * both, so each tab's query key contains only what actually invalidates it. A
 * single combined hook would have to refetch both listings to change either, and
 * "load more" on posts would spend a request on comments nobody is looking at.
 */
export const useProfilePosts = (
  userId: string | undefined,
): ActivityResult<IPostRow> => {
  const [offset, setOffset] = useState(0);
  const api = useMemo(() => new PostsApiService(), []);

  const query = useQuery({
    // Keyed on the member as well as the window, so opening a different profile
    // starts at the first page instead of showing the previous member's.
    queryKey: ["profile", "posts", userId, offset],
    queryFn: () => api.list({ limit: PAGE_SIZE, offset, userId }),
    enabled: Boolean(userId),
    // Holds the last page on screen while the next one loads, so "load more"
    // does not blank the list and throw away the reader's scroll position.
    placeholderData: keepPreviousData,
    // Counts go stale quietly on a profile, and nobody watches one for updates.
    // Long enough to survive ordinary navigation, short enough that a post you
    // just wrote appears without a hard refresh.
    staleTime: 30_000,
    /*
     * A member who has posted nothing is the ordinary case for this tab, and the
     * answer "none" is a success, not a failure -- so the default three retries
     * would only ever apply to a real error. Capped to one so a genuine outage
     * reports itself instead of re-asking three times behind a skeleton.
     */
    retry: 1,
  });

  const totalCount = query.data?.totalCount ?? 0;
  const rows = query.data?.posts ?? [];

  return {
    rows,
    totalCount,
    offset,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.isError ? describe(query.error) : null,
    // Derived from the rows actually held rather than from the offset, so a
    // short final page disables the button instead of offering a page of nothing.
    hasMore: rows.length > 0 && offset + rows.length < totalCount,
    loadMore: useCallback(() => setOffset((o) => o + PAGE_SIZE), []),
  };
};

/**
 * One member's comments, newest first, each with the post it belongs to.
 *
 * `enabled` lets a caller that will not show the list skip the request entirely.
 * The hook still returns a well-formed empty result, so the caller does not need
 * to know whether it asked: `isLoading` false, no error, nothing to load more of.
 */
export const useProfileComments = (
  userId: string | undefined,
  enabled = true,
): ActivityResult<ICommentRow> => {
  const [offset, setOffset] = useState(0);
  const api = useMemo(() => new CommentsApiService(), []);

  const query = useQuery({
    queryKey: ["profile", "comments", userId, offset],
    queryFn: () => api.listByUser(userId!, PAGE_SIZE, offset),
    enabled: Boolean(userId) && enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    // Same reasoning as the posts tab above.
    retry: 1,
  });

  const totalCount = query.data?.totalCount ?? 0;
  const rows = query.data?.comments ?? [];

  return {
    rows,
    totalCount,
    offset,
    // A query that was never started is neither loading nor failed, so the caller
    // shows its "not asked for" state rather than a spinner that never resolves.
    isLoading: enabled && query.isLoading,
    isFetching: query.isFetching,
    error: query.isError ? describe(query.error) : null,
    hasMore: rows.length > 0 && offset + rows.length < totalCount,
    loadMore: useCallback(() => setOffset((o) => o + PAGE_SIZE), []),
  };
};
