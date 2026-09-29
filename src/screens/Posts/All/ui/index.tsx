"use client";

import { useEffect, FC } from "react";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { usePostsFeed, type IPostsFiltersSeed } from "../model/usePostsFeed";
import { PostCard } from "./PostCard";
import { PostsFilters } from "./PostsFilters";
import { LoadMoreSentinel } from "./LoadMoreSentinel";

const SKELETON_KEYS = [0, 1, 2];

interface AllPostsPageProps {
  /** Filters parsed from the query string on the server. */
  initialFilters: IPostsFiltersSeed;
}

export const AllPostsPage: FC<AllPostsPageProps> = ({ initialFilters }) => {
  const {
    posts,
    totalCount,
    isPending,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
    filters,
    searchInput,
    setSearch,
    setCategoryId,
    setSort,
    categories,
  } = usePostsFeed(initialFilters);

  useEffect(() => {
    if (error) {
      toast.add({
        type: "error",
        title: "Posts error",
        description: "Error on getting posts list!",
      });
    }
  }, [error]);

  const hasFilters =
    filters.search !== "" ||
    filters.categoryId !== 0 ||
    filters.sort !== "newest";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
        <p className="shrink-0 text-sm text-muted-foreground">
          {isPending
            ? "…"
            : `${totalCount} ${totalCount === 1 ? "post" : "posts"}`}
        </p>
      </div>

      <PostsFilters
        search={searchInput}
        categoryId={filters.categoryId}
        sort={filters.sort}
        categories={categories}
        onSearchChange={setSearch}
        onCategoryChange={setCategoryId}
        onSortChange={setSort}
      />

      {isPending ? (
        <div className="flex flex-col gap-3">
          {SKELETON_KEYS.map((key) => (
            <div
              key={key}
              className="flex flex-col gap-3 rounded-lg border p-4"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : posts.length ? (
        <div
          className={`flex flex-col gap-3 transition-opacity ${
            isFetching && !isFetchingNextPage ? "opacity-60" : "opacity-100"
          }`}
        >
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {hasFilters
              ? "No posts match your filters."
              : "No posts yet. Be the first to write one."}
          </p>
        </div>
      )}

      {!isPending && posts.length > 0 ? (
        <LoadMoreSentinel
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
        />
      ) : null}
    </div>
  );
};
