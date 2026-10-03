"use client";

import { CSSProperties, FC } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/src/share/ui/UserAvatar";
import { IContributor } from "../model/useHomeData";
import { PanelStatus } from "./panelStatus";
import PanelMessage from "./PanelMessage";

interface TopContributorsProps {
  contributors: IContributor[];
  status: PanelStatus;
  /** How many authors the full ranking holds, so the list can admit it is a top slice. */
  totalAuthors: number;
}

const SHOWN = 5;

/**
 * The same clock the category distribution runs on, so the two panels read as
 * one reading of the board rather than two animations that happen to be near
 * each other. Ranked order, capped, same reason: a longer ranking would
 * otherwise still be arriving after the page had settled.
 */
const RANK_STEP_MS = 40;
const RANK_STEP_CAP = 4;

/**
 * Authors ranked by how much they have posted in the recent sample. Ranked on
 * posts first and comments as the tie-break, because posts are the scarcer
 * contribution here.
 *
 * The bar encodes posts per author against the busiest one. It is the one
 * measure this page shows in a neutral ink rather than a category colour,
 * because these rows belong to no category -- a coloured bar here would borrow
 * an identity the row does not have.
 */
export const TopContributors: FC<TopContributorsProps> = ({
  contributors,
  status,
  totalAuthors,
}) => {
  const shown = contributors.slice(0, SHOWN);
  const busiest = shown.reduce((max, c) => Math.max(max, c.posts), 0);
  const isTopSlice = totalAuthors > shown.length;

  return (
    // `min-w-0` for the same reason as the panel beside it: a grid item that is
    // `auto` sized would otherwise be widened by its longest unbreakable text.
    <section aria-labelledby="contributors-title" className="min-w-0 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="contributors-title"
          className="text-base font-semibold tracking-[-0.015em]"
        >
          Active contributors
        </h2>

        {status === "ready" && isTopSlice ? (
          <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
            Top {shown.length} of {totalAuthors}
          </p>
        ) : null}
      </div>

      {status === "loading" ? (
        <ul className="overflow-hidden rounded-xl border bg-card">
          {Array.from({ length: 3 }).map((_, index) => (
            <li
              key={index}
              className={`flex items-center gap-3 p-4 ${index > 0 ? "border-t" : ""}`}
            >
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-1 w-full" />
              </div>
              <Skeleton className="h-4 w-8" />
            </li>
          ))}
        </ul>
      ) : status === "unavailable" ? (
        <PanelMessage tone="unavailable">
          The contributor list could not be loaded.
        </PanelMessage>
      ) : status === "empty" ? (
        <PanelMessage>No posts from the recent sample yet.</PanelMessage>
      ) : (
        <ul className="overflow-hidden rounded-xl border bg-card">
          {shown.map((contributor, index) => {
            const share = busiest > 0 ? Math.max(contributor.posts / busiest, 0.08) : 0;
            const delay = `${Math.min(index, RANK_STEP_CAP) * RANK_STEP_MS}ms`;

            return (
              <li
                key={contributor.username}
                className={`settle flex items-center gap-3 p-4 ${index > 0 ? "border-t" : ""}`}
                style={{ "--settle-delay": delay } as CSSProperties}
              >
                <UserAvatar
                id={contributor.id ?? ""}
                username={contributor.username}
                hasAvatar={contributor.hasAvatar}
                avatarUpdatedAt={contributor.avatarUpdatedAt}
                className="size-8 shrink-0"
                fallbackClassName="bg-muted text-xs font-medium text-foreground"
              />

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {contributor.username}
                  </span>
                  <span
                    aria-hidden
                    className="mt-1.5 block h-1 overflow-hidden rounded-full bg-foreground/10"
                  >
                    <span
                      className="bar-grow block h-full rounded-full bg-foreground/35"
                      style={
                        {
                          "--bar-delay": delay,
                          width: `${Math.round(share * 100)}%`,
                        } as CSSProperties
                      }
                    />
                  </span>
                </span>

                <span className="shrink-0 text-right text-xs text-muted-foreground">
                  <span className="block font-medium tabular-nums text-foreground">
                    {contributor.posts}
                  </span>
                  {contributor.posts === 1 ? "post" : "posts"}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {status === "ready" ? (
        <p className="text-xs text-muted-foreground">
          Counted from the 50 newest posts.
        </p>
      ) : null}
    </section>
  );
};

export default TopContributors;
