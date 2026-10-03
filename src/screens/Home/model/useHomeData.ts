"use client";

import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { CategoriesApiService } from "@/src/share/api/CategoriesApiService";
import { PostsApiService } from "@/src/share/api/PostsApiService";
import { IQueryError } from "@/src/share/api/model/api";
import { ICategory } from "@/src/share/api/model/categories";
import { IPostRow, IPostsListRes } from "@/src/share/api/model/posts";

const postsApi = new PostsApiService();
const categoriesApi = new CategoriesApiService();

/**
 * How many of the newest posts to pull for the "what's happening" panels.
 *
 * This is a sample, not the whole table: the API caps a page at 100 and the
 * total post count arrives separately as `totalCount`. Anything derived from
 * this sample is labelled as being about recent posts rather than presented as
 * a site-wide total.
 */
const RECENT_SAMPLE_SIZE = 50;

/**
 * Upper bound on the per-category count fan-out below. Each entry costs one
 * small request, so a category list that has grown very large is truncated
 * rather than firing hundreds of queries on every home page view.
 */
const MAX_COUNTED_CATEGORIES = 20;

export interface ICategoryStat {
  category: ICategory;
  /**
   * Exact number of posts in this category, or null when the count could not be
   * fetched. Null rather than 0 on purpose: a failed count is not an empty
   * category, and rendering 0 would state something the API never said.
   */
  posts: number | null;
}

export interface IContributor {
  username: string;
  /**
   * The member's id, carried so the row can resolve their avatar.
   *
   * Keyed by username in the aggregation because that is what the ranking is
   * about, but the id is what an avatar URL needs -- and the username is mutable,
   * so it is the wrong thing to hang a stable image reference on.
   */
  id?: string;
  hasAvatar?: boolean;
  avatarUpdatedAt?: number;
  posts: number;
  comments: number;
}

export interface IHomeData {
  /** Exact count of every post on the site, or null if it could not be read. */
  totalPosts: number | null;
  /** Exact number of categories, or null if it could not be read. */
  totalCategories: number | null;
  /** The newest posts, for the recent-activity panel. */
  recentPosts: IPostRow[];
  /** True when the post list failed, so the panels must not read as "empty". */
  isPostsUnavailable: boolean;
  /** True when the category list failed. */
  isCategoriesUnavailable: boolean;
  /** Categories with their exact post counts, busiest first. */
  categories: ICategoryStat[];
  /** True while any per-category count is still in flight. */
  isCountsSettling: boolean;
  /** True when at least one per-category count failed. */
  isAnyCountFailed: boolean;
  /** True when categories exist beyond the counted cap. */
  hasUncountedCategories: boolean;
  /** Authors ranked by posts in the recent sample. */
  contributors: IContributor[];
  /** Comments on the recent sample only -- not a site-wide total. */
  commentsOnRecent: number | null;
  /** True until the two primary requests have settled once, with no data yet. */
  isFirstLoad: boolean;
  /** True while any request is in flight after the first load. */
  isRefetching: boolean;
  /** Set when a request failed, for a retry affordance. */
  error: string | null;
  /** Re-runs every request this page depends on. */
  retry: () => void;
}

const errorMessage = (err: unknown, fallback: string): string => {
  if (err && typeof err === "object" && "response" in err) {
    const { response } = err as AxiosError<IQueryError>;
    if (response?.data?.error) {
      return response.data.error;
    }
  }
  return fallback;
};

/**
 * Loads everything the home page shows.
 *
 * The post totals come from the API's own `totalCount` rather than from the
 * length of the fetched page, so the headline numbers stay correct no matter
 * how many posts exist. Per-category counts need one small query each because
 * the API offers no grouped endpoint; `useQueries` keeps them deduplicated and
 * cached instead of firing them by hand.
 *
 * Two rules hold across the whole hook, because this page reports the state of
 * a real board:
 *
 * 1. A figure that was never fetched is null, never 0. A failed request is not
 *    evidence of an empty board, so nothing here may render a zero it did not
 *    read.
 * 2. A figure that has been read is not re-rendered as a skeleton on a
 *    background refetch. `isFirstLoad` is about having no data at all, so
 *    invalidation keeps the numbers on screen instead of blanking them.
 */
export const useHomeData = (): IHomeData => {
  const postsQuery = useQuery<IPostsListRes, AxiosError<IQueryError>>({
    queryKey: ["home", "posts"],
    queryFn: () =>
      postsApi.list({ limit: RECENT_SAMPLE_SIZE, offset: 0, sort: "newest" }),
    /*
     * The shared client is built with react-query's default of three retries.
     * Against a gateway that is down that is four requests and several seconds
     * of skeleton before the page admits it is broken, and a visitor cannot
     * tell that apart from a slow first load. One retry still covers a dropped
     * connection, which is the failure worth waiting out; anything past that is
     * an outage the banner should report now rather than keep retrying through.
     */
    retry: 1,
  });

  const categoriesQuery = useQuery<ICategory[], AxiosError<IQueryError>>({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
    retry: 1,
  });

  const allCategories = useMemo(
    () => categoriesQuery.data ?? [],
    [categoriesQuery.data],
  );

  const recentPosts = useMemo(
    () => postsQuery.data?.posts ?? [],
    [postsQuery.data],
  );

  /*
   * Every post in the sample carries its category, so when the whole board fits
   * inside one page the per-category totals can be read straight off it and the
   * whole fan-out below is skipped: the home page goes from ten requests to two.
   *
   * The counts stay exact rather than becoming an estimate -- comparing against
   * `totalCount` is what makes that true, and is why this is not just "assume the
   * board is small". Past the page size the sample is a subset and the totals
   * would understate the busier categories, so the fan-out takes over.
   */
  const canDeriveCounts =
    postsQuery.isSuccess &&
    (postsQuery.data?.totalCount ?? Infinity) <= RECENT_SAMPLE_SIZE;

  // Seeded with the category list so the cards can render their name and colour
  // immediately, then each entry fills in its count as its query resolves.
  const countedCategories = useMemo(
    () => allCategories.slice(0, MAX_COUNTED_CATEGORIES),
    [allCategories],
  );

  const countQueries = useQueries({
    /*
     * No retries on the fan-out. This is up to 20 requests, so the client's
     * default of three would mean 80 requests against a gateway that is already
     * failing, and every extra one holds the whole grid in its loading state,
     * because the grid waits for the entire set before it paints. A count is
     * cheap and is re-requested on the next visit, so one attempt is enough; a
     * tile that loses its count shows a dash and the grid says so underneath.
     */
    queries: canDeriveCounts
      ? []
      : countedCategories.map((category) => ({
          queryKey: ["home", "categoryCount", category.id],
          // limit 1: only `totalCount` is wanted, so the page body is not fetched.
          queryFn: () =>
            postsApi.list({ limit: 1, offset: 0, categoryId: category.id }),
          staleTime: 60_000,
          retry: false,
        })),
  });

  const derivedCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const post of recentPosts) {
      const id = post.category?.id;
      if (typeof id === "number") {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    }
    return counts;
  }, [recentPosts]);

  const categories = useMemo<ICategoryStat[]>(() => {
    const entries = countedCategories.map((category, index) => ({
      category,
      /*
       * Zero and unknown are different facts, and only a settled answer can
       * report the first one. The API omits `totalCount` for an empty result --
       * a category with no posts answers `{}` -- so a missing field on a
       * successful response means 0, while a request that has not answered, or
       * that failed, means nothing is known yet.
       */
      posts: canDeriveCounts
        ? (derivedCounts.get(category.id) ?? 0)
        : (() => {
            const query = countQueries[index];
            return query?.isSuccess ? (query.data?.totalCount ?? 0) : null;
          })(),
    }));

    // Busiest first, then alphabetical so equal counts do not shuffle between
    // renders. Unreadable counts sink to the bottom instead of competing with
    // real ones, and sort alphabetically among themselves.
    return entries.sort((a, b) => {
      if (a.posts === null || b.posts === null) {
        if (a.posts !== b.posts) {
          return a.posts === null ? 1 : -1;
        }
        return a.category.name.localeCompare(b.category.name);
      }
      return (
        b.posts - a.posts || a.category.name.localeCompare(b.category.name)
      );
    });
  }, [countedCategories, countQueries, canDeriveCounts, derivedCounts]);

  const { contributors, commentsOnRecent } = useMemo(() => {
    const byAuthor = new Map<string, IContributor>();
    let comments = 0;

    for (const post of recentPosts) {
      const username = post.user?.username;
      if (!username) {
        continue;
      }
      const commentCount = post.commentsCount ?? 0;
      comments += commentCount;

      // Taken from the post rather than looked up, so the contributor row carries
      // the avatar state the same response already delivered.
      const author = {
        id: post.user?.id,
        hasAvatar: post.user?.hasAvatar,
        avatarUpdatedAt: post.user?.avatarUpdatedAt,
      };

      const existing = byAuthor.get(username);
      if (existing) {
        existing.posts += 1;
        existing.comments += commentCount;
        // Last writer wins. A member who changed their picture mid-sample would
        // otherwise be ranked with whichever row happened to be seen first.
        existing.id = author.id;
        existing.hasAvatar = author.hasAvatar;
        existing.avatarUpdatedAt = author.avatarUpdatedAt;
      } else {
        byAuthor.set(username, {
          username,
          ...author,
          posts: 1,
          comments: commentCount,
        });
      }
    }

    const ranked = [...byAuthor.values()].sort(
      (a, b) => b.posts - a.posts || b.comments - a.comments ||
        a.username.localeCompare(b.username),
    );

    return { contributors: ranked, commentsOnRecent: comments };
  }, [recentPosts]);

  const isFirstLoad = postsQuery.isPending || categoriesQuery.isPending;

  // A failed request with nothing cached behind it leaves the figure unknown.
  // A failed *refetch* keeps the last good numbers on screen instead.
  const isPostsUnavailable = postsQuery.isError && postsQuery.data === undefined;
  const isCategoriesUnavailable =
    categoriesQuery.isError && categoriesQuery.data === undefined;

  let error: string | null = null;
  if (postsQuery.isError) {
    error = errorMessage(postsQuery.error, "could not load posts");
  } else if (categoriesQuery.isError) {
    error = errorMessage(categoriesQuery.error, "could not load categories");
  }

  const isCountsSettling = countQueries.some((query) => query.isPending);

  const isAnyCountFailed = countQueries.some((query) => query.isError);

  return {
    totalPosts: isPostsUnavailable ? null : (postsQuery.data?.totalCount ?? 0),
    totalCategories: isCategoriesUnavailable ? null : allCategories.length,
    recentPosts,
    isPostsUnavailable,
    isCategoriesUnavailable,
    categories,
    isCountsSettling,
    isAnyCountFailed,
    hasUncountedCategories: allCategories.length > countedCategories.length,
    contributors,
    commentsOnRecent: isPostsUnavailable ? null : commentsOnRecent,
    isFirstLoad,
    isRefetching:
      postsQuery.isFetching ||
      categoriesQuery.isFetching ||
      countQueries.some((query) => query.isFetching),
    error,
    retry: () => {
      void postsQuery.refetch();
      void categoriesQuery.refetch();
      for (const query of countQueries) {
        void query.refetch();
      }
    },
  };
};
