"use client";

import { CSSProperties, FC } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ICategoryStat } from "../model/useHomeData";
import { PanelStatus } from "./panelStatus";
import PanelMessage from "./PanelMessage";

interface CategoryDirectoryProps {
  categories: ICategoryStat[];
  status: PanelStatus;
  /** Total categories on the site, to name what the grid is leaving out. */
  totalCategories: number | null;
  /** True when at least one tile's count failed. */
  isAnyCountFailed: boolean;
}

const plural = (count: number, word: string) =>
  `${count} ${count === 1 ? word : `${word}s`}`;

/**
 * The interval between two tiles of the distribution, and where it stops.
 *
 * This is what makes the grid a reading instead of a decoration. The tiles are
 * sorted busiest first, so staggering their arrival down that order lets the
 * eye follow the shape of the distribution descending -- which is the one thing
 * this panel is for -- rather than watching eight bars twitch at once and
 * leaving the shape to be inferred afterwards.
 *
 * The step is short enough that the whole grid lands inside the eye's
 * patience, and the cap is what bounds it: a board with many categories would
 * otherwise still be growing long after the page had settled, and the last
 * tiles would arrive as a separate event rather than as part of this one. Past
 * the cap the tiles land together, so the sequence always resolves in one
 * gesture no matter how long the tail is.
 */
const RANK_STEP_MS = 40;
const RANK_STEP_CAP = 6;

/**
 * Every category with its exact post count, busiest first. Each entry deep-links
 * into the feed pre-filtered to that category, which is the useful next action
 * rather than a dead-end listing.
 *
 * The tiles wait for their counts instead of rendering zeros while the per
 * category queries are in flight: a tile that says "0 posts" while its request
 * is still open is a claim the API never made, and the grid would also reshuffle
 * itself as the numbers arrived. Loading the whole grid for one round trip
 * avoids both.
 */
export const CategoryDirectory: FC<CategoryDirectoryProps> = ({
  categories,
  status,
  totalCategories,
  isAnyCountFailed,
}) => {
  // The bar length is relative to the busiest category, so the busiest tile is
  // always full and the shape of the distribution is readable at a glance.
  const busiest = categories.reduce(
    (max, entry) => Math.max(max, entry.posts ?? 0),
    0,
  );

  return (
    <section aria-labelledby="categories-title" className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="categories-title"
          className="text-base font-semibold tracking-[-0.015em]"
        >
          Browse by category
        </h2>

        {/*
          The grid counts at most 20 categories, so say so when there are more
          rather than letting a truncated list read as the whole board.
        */}
        {totalCategories !== null && totalCategories > categories.length ? (
          <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
            Showing {categories.length} of {totalCategories}
          </p>
        ) : null}
      </div>

      {status === "loading" ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <li
              key={index}
              className="relative overflow-hidden rounded-xl border bg-card px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-12" />
              </div>
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 block h-0.5 bg-foreground/10"
              />
            </li>
          ))}
        </ul>
      ) : status === "unavailable" ? (
        <PanelMessage tone="unavailable">
          The category list could not be loaded.
        </PanelMessage>
      ) : status === "empty" ? (
        <PanelMessage>
          No categories yet. An admin can create the first one from the admin
          panel.
        </PanelMessage>
      ) : (
        <>
          <ul className="grid gap-3 sm:grid-cols-2">
            {categories.map(({ category, posts }, index) => {
              // The floor keeps a real but small count visible next to the
              // busiest category. It deliberately does not apply to zero: an
              // empty category has an empty track, because a sliver there
              // would overstate a count of nothing.
              const share =
                posts !== null && posts > 0 && busiest > 0
                  ? Math.max(posts / busiest, 0.06)
                  : 0;

              // One delay for the tile and its bar, so a row arrives as a
              // single object rather than as a label and a bar arriving
              // separately. The bar reads its delay from the same value.
              const delay = `${Math.min(index, RANK_STEP_CAP) * RANK_STEP_MS}ms`;

              return (
                <li key={category.id} className="settle min-w-0" style={{ "--settle-delay": delay } as CSSProperties}>
                  <Link
                    href={`/posts?categoryId=${category.id}`}
                    className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card px-4 py-3 transition-colors hover:border-ring/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        {/* The colour comes from the category, passed through the
                            shared clamp so a black or near-white category still
                            reads against the card. */}
                        <span
                          aria-hidden
                          className="category-ink size-2.5 shrink-0 rounded-full"
                          style={
                            { "--cat-color": category.color } as CSSProperties
                          }
                        />
                        <span className="truncate font-medium">
                          {category.name}
                        </span>
                      </span>

                      <span className="flex shrink-0 items-center gap-1 text-xs tabular-nums text-muted-foreground transition-colors group-hover:text-foreground">
                        {posts === null ? "—" : plural(posts, "post")}
                        <ArrowRight
                          className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100"
                          aria-hidden
                        />
                      </span>
                    </span>

                    {/* The distribution reads as one band along the bottom edge
                        of the tiles rather than a bar floating in each card. The
                        track is a tint of the ink rather than `--muted`, which
                        is nearly invisible against a light card but reads on a
                        dark one; an ink tint holds in both. */}
                    <span
                      aria-hidden
                      className="absolute inset-x-0 bottom-0 block h-0.5 bg-foreground/10"
                    >
                      <span
                        className="bar-grow category-ink block h-full"
                        style={
                          {
                            "--cat-color": category.color,
                            "--bar-delay": delay,
                            width: `${Math.round(share * 100)}%`,
                          } as CSSProperties
                        }
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {isAnyCountFailed ? (
            <p className="text-xs text-muted-foreground">
              Some counts could not be loaded, so they show as a dash.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
};

export default CategoryDirectory;
