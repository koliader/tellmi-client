"use client";

import { useEffect, FC } from "react";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountUp } from "@/src/share/lib/useCountUp";
import { usePostsFeed, type IPostsFiltersSeed } from "../model/usePostsFeed";
import { PostCard } from "./PostCard";
import { NoResults } from "./NoResults";
import { PostsFilters } from "./PostsFilters";
import { LoadMoreSentinel } from "./LoadMoreSentinel";

const SKELETON_KEYS = [0, 1, 2];

interface AllPostsPageProps {
  /** Filters parsed from the query string on the server. */
  initialFilters: IPostsFiltersSeed;
}

/**
 * How many posts the filters match.
 *
 * Counts up rather than snapping, because on this page the count is the only
 * thing that reports what a filter change did. The list itself holds the
 * previous result while the new one loads, so for as long as that takes the
 * only evidence that a category or a sort order did anything is this figure
 * moving. Asking for more posts, or a different category, and watching it land
 * is the feedback that closes the loop.
 */
const ResultCount: FC<{ total: number }> = ({ total }) => {
  const counted = useCountUp(total);

  return (
    <p className="shrink-0 text-sm text-muted-foreground">
      <span aria-hidden>{`${counted ?? 0} `}</span>
      <span className="sr-only">{`${total} `}</span>
      {total === 1 ? "post" : "posts"}
    </p>
  );
};

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


  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Posts</h1>
        {isPending ? (
          <p className="shrink-0 text-sm text-muted-foreground">…</p>
        ) : (
          <ResultCount total={totalCount} />
        )}
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
        /*
          The dim is the loading acknowledgement for a filter change: the list
          holds its previous result while the new one is fetched, and without
          this the list would simply sit there looking final.

          A plain block comment rather than a JSX comment container: this sits
          inside a ternary branch, which takes exactly one expression, so a
          comment container here would count as a second child.
        */
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
        /*
          Settles for the same reason the cards do: narrowing the filters until
          nothing matches replaces the whole list with this box, and a box that
          appears by subtraction is easy to miss entirely -- the visitor has no
          way to tell whether the feed is genuinely empty or failed to re-render.
        */
        <NoResults
          search={filters.search}
          categoryId={filters.categoryId}
          categoryName={categories.find((c) => c.id === filters.categoryId)?.name}
          onClearSearch={() => setSearch("")}
          onClearCategory={() => setCategoryId(0)}
        />
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
