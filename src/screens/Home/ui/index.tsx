"use client";

import { FC } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/src/share/api/useCurrentUser";
import { useHomeData } from "../model/useHomeData";
import FeatureBento from "./FeatureBento";
import CategoryDirectory from "./CategoryDirectory";
import RecentActivity from "./RecentActivity";
import TopContributors from "./TopContributors";
import { PanelStatus } from "./panelStatus";

/**
 * The landing page.
 *
 * Every number here comes from the live API rather than being hardcoded, so the
 * page reports the state of the community rather than a designer's idea of it.
 * Where a figure can only be derived from a sample of recent posts, the label
 * says so instead of implying a site-wide total.
 */
export const HomePage: FC = () => {
  const { payload, username } = useCurrentUser();
  const {
    totalPosts,
    totalCategories,
    recentPosts,
    isPostsUnavailable,
    isCategoriesUnavailable,
    categories,
    isFirstLoad,
    isRefetching,
    isCountsSettling,
    isAnyCountFailed,
    contributors,
    commentsOnRecent,
    error,
    retry,
  } = useHomeData();

  // A panel's status is derived once, here, so a failed request can never be
  // rendered as an empty board.
  const statusFor = (
    isUnavailable: boolean,
    hasItems: boolean,
  ): PanelStatus => {
    if (isFirstLoad) {
      return "loading";
    }
    if (isUnavailable) {
      return "unavailable";
    }
    return hasItems ? "ready" : "empty";
  };

  // The tiles carry per-category counts, so the grid holds its loading state
  // until those land rather than painting zeros that resolve a moment later.
  // A count that failed is not pending, so it settles the grid and shows a dash.
  const categoriesStatus: PanelStatus = isFirstLoad
    ? "loading"
    : isCategoriesUnavailable
      ? "unavailable"
      : isCountsSettling
        ? "loading"
        : categories.length > 0
          ? "ready"
          : "empty";

  const isSignedIn = Boolean(payload);

  /*
   * The banner names the two situations separately. "Could not be refreshed"
   * would be false against figures that were never read at all, and a dash is
   * the marker for a figure the API never answered, so the banner has to say
   * the same thing the cells below it say.
   */
  const isNothingLoaded = isPostsUnavailable && isCategoriesUnavailable;

  return (
    <div className="space-y-10 pb-20 sm:space-y-12 sm:pb-10">
      <FeatureBento
        isSignedIn={isSignedIn}
        username={username}
        totalPosts={totalPosts}
        commentsOnRecent={isPostsUnavailable ? null : commentsOnRecent}
        isLoading={isFirstLoad}
      />

      {error ? (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
        >
          <span className="flex items-start gap-2.5 text-sm leading-relaxed text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span className="min-w-0">
              <span className="font-medium">{error}.</span>{" "}
              {isNothingLoaded
                ? "Nothing on this page could be loaded, so the figures below are marked unavailable rather than empty."
                : "The figures that could not be loaded are marked unavailable below."}
            </span>
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={retry}
            disabled={isRefetching}
            className="shrink-0 cursor-pointer"
          >
            <RefreshCw
              className={`size-3.5 ${isRefetching ? "animate-spin" : ""}`}
              aria-hidden
            />
            {isRefetching ? "Retrying" : "Try again"}
          </Button>
        </div>
      ) : null}

      <CategoryDirectory
        categories={categories}
        status={categoriesStatus}
        totalCategories={totalCategories}
        isAnyCountFailed={isAnyCountFailed}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <RecentActivity
          posts={recentPosts}
          status={statusFor(isPostsUnavailable, recentPosts.length > 0)}
          isSignedIn={isSignedIn}
        />
        <TopContributors
          contributors={contributors}
          status={statusFor(isPostsUnavailable, contributors.length > 0)}
          totalAuthors={contributors.length}
        />
      </div>
    </div>
  );
};
