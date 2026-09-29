"use client";

import {
  InfiniteData,
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AxiosError } from "axios";
import { CategoriesApiService } from "@/src/share/api/CategoriesApiService";
import { PostsApiService } from "@/src/share/api/PostsApiService";
import { IQueryError } from "@/src/share/api/model/api";
import { ICategory } from "@/src/share/api/model/categories";
import {
  IPostRow,
  IPostsListRes,
  TPostsSort,
} from "@/src/share/api/model/posts";

/** Posts fetched per infinite-scroll batch. */
export const POSTS_BATCH_SIZE = 5;

const postsApi = new PostsApiService();
const categoriesApi = new CategoriesApiService();

export interface IPostsFilters {
  search: string;
  /** 0 means "all categories". */
  categoryId: number;
  sort: TPostsSort;
}

/** Filters as handed down from the server, parsed from the query string. */
export type IPostsFiltersSeed = IPostsFilters;

export const DEFAULT_POSTS_FILTERS: IPostsFilters = {
  search: "",
  categoryId: 0,
  sort: "newest",
};

type PostsQueryKey = readonly ["posts", IPostsFilters];

/** Serialises filters, leaving defaults out so shared URLs stay clean. */
const serializeFilters = (filters: IPostsFilters): string => {
  const params = new URLSearchParams();
  if (filters.search) {
    params.set("search", filters.search);
  }
  if (filters.categoryId) {
    params.set("categoryId", String(filters.categoryId));
  }
  if (filters.sort !== "newest") {
    params.set("sort", filters.sort);
  }
  return params.toString();
};

const parseFilters = (search: string): IPostsFilters => {
  const params = new URLSearchParams(search);
  const rawSort = params.get("sort");
  const rawCategory = Number(params.get("categoryId"));

  return {
    search: params.get("search") ?? "",
    categoryId: Number.isFinite(rawCategory) && rawCategory > 0 ? rawCategory : 0,
    sort: rawSort === "oldest" ? "oldest" : "newest",
  };
};

export interface IUsePostsFeed {
  /** Every post loaded so far, in feed order. */
  posts: IPostRow[];
  /** Total matching the filters, for the header count. */
  totalCount: number;
  isPending: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  error: AxiosError<IQueryError> | null;
  filters: IPostsFilters;
  /** Live text input value, which leads the debounced URL. */
  searchInput: string;
  setSearch: (search: string) => void;
  setCategoryId: (categoryId: number) => void;
  setSort: (sort: TPostsSort) => void;
  categories: ICategory[];
}

/**
 * Owns the posts feed.
 *
 * The filters live in React state, seeded from the server-rendered query
 * string, and are mirrored into the URL. The URL is written with the History
 * API rather than the Next router so a filter change updates the address bar
 * without triggering a navigation, and a `popstate` listener picks the state
 * back up on browser back/forward. That keeps the feed bookmarkable, shareable
 * and reload-safe.
 *
 * Because the filters are plain state, changing one also changes the query key,
 * so TanStack Query starts a fresh infinite query and discards the pages
 * accumulated so far.
 */
export const usePostsFeed = (
  initialFilters: IPostsFilters = DEFAULT_POSTS_FILTERS,
): IUsePostsFeed => {
  const router = useRouter();
  const pathname = usePathname();

  const [filters, setFilters] = useState<IPostsFilters>(initialFilters);
  const [searchInput, setSearchInput] = useState(initialFilters.search);

  // Write the current filters to the URL without navigating.
  const pushFilters = useCallback(
    (next: IPostsFilters) => {
      const query = serializeFilters(next);
      const url = query ? `${pathname}?${query}` : pathname;
      window.history.replaceState(null, "", url);
    },
    [pathname],
  );

  // Browser back/forward: adopt whatever the URL now says.
  useEffect(() => {
    const onPopState = () => {
      const next = parseFilters(window.location.search);
      setFilters(next);
      setSearchInput(next.search);
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Debounce the text input so typing does not fire a request per keystroke.
  useEffect(() => {
    if (searchInput === filters.search) {
      return;
    }

    const timeout = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput }));
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchInput, filters.search]);

  // Keep the URL in step with the committed filters.
  useEffect(() => {
    pushFilters(filters);
  }, [filters, pushFilters]);

  const query = useInfiniteQuery<
    IPostsListRes,
    AxiosError<IQueryError>,
    InfiniteData<IPostsListRes, number>,
    PostsQueryKey,
    number
  >({
    queryKey: ["posts", filters],
    queryFn: async ({ pageParam }) => {
      const res = await postsApi.list({
        limit: POSTS_BATCH_SIZE,
        offset: pageParam,
        search: filters.search,
        categoryId: filters.categoryId,
        sort: filters.sort,
      });

      // An empty result serialises to `{}`: the protobuf fields carry
      // `omitempty`, so both `posts` and `totalCount` are dropped when they
      // are empty and zero. Normalise them here so nothing downstream has to
      // guard against a missing `posts` array.
      return {
        posts: res.posts ?? [],
        totalCount: res.totalCount ?? 0,
      };
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      // Everything matching the filters has been loaded.
      const loaded = allPages.reduce((sum, page) => sum + page.posts.length, 0);
      if (loaded >= lastPage.totalCount) {
        return undefined;
      }

      // Defensive: a short or empty page means the offset is not advancing,
      // so asking for the next one would loop on the same window forever.
      if (lastPage.posts.length < POSTS_BATCH_SIZE) {
        return undefined;
      }

      return lastPageParam + POSTS_BATCH_SIZE;
    },
    // Hold the previous result while a new filter set loads, so the list does
    // not collapse to an empty state between keystrokes.
    placeholderData: keepPreviousData,
  });

  const {
    data,
    isPending,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage: fetchMore,
    error,
  } = query;

  const posts = data ? data.pages.flatMap((page) => page.posts) : [];
  // The count is filter-scoped, not page-scoped, so any page carries it; the
  // first one is the cheapest to read.
  const totalCount = data?.pages[0]?.totalCount ?? 0;

  const { data: categories } = useQuery<ICategory[], AxiosError<IQueryError>>({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  // Stable identity, so consumers can pass it straight into an effect or an
  // observer callback without re-subscribing on every render.
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchMore();
    }
  }, [hasNextPage, isFetchingNextPage, fetchMore]);

  return {
    posts,
    totalCount,
    isPending,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage: loadMore,
    error,
    filters,
    searchInput,
    setSearch: setSearchInput,
    setCategoryId: (categoryId) => setFilters((prev) => ({ ...prev, categoryId })),
    setSort: (sort) => setFilters((prev) => ({ ...prev, sort })),
    categories: categories ?? [],
  };
};
