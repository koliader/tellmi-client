"use client";

import { FC } from "react";
import Link from "next/link";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryBadge } from "@/src/share/ui/CategoryBadge";
import { formatRelativeTime } from "@/src/share/lib/formatRelativeTime";
import { UserAvatar } from "@/src/share/ui/UserAvatar";
import { IPostRow } from "@/src/share/api/model/posts";
import { PanelStatus } from "./panelStatus";
import PanelMessage from "./PanelMessage";

interface RecentActivityProps {
  posts: IPostRow[];
  status: PanelStatus;
  /** So the empty state can offer the action this visitor can actually take. */
  isSignedIn: boolean;
}

const RECENT_LIMIT = 6;

/**
 * The newest handful of posts, as a compact list rather than full cards.
 *
 * The rows share one bordered surface and are divided by hairlines instead of
 * each becoming a card of its own: a list of six cards is six boxes to scan
 * past, while a divided list reads as a single run of recent writing. Category
 * identity comes from the shared badge so the same category looks the same here
 * as it does in the feed and on a post.
 */
export const RecentActivity: FC<RecentActivityProps> = ({
  posts,
  status,
  isSignedIn,
}) => {
  const shown = posts.slice(0, RECENT_LIMIT);

  return (
    // `min-w-0` because this is a grid item: a grid track is `auto` by default,
    // so without it a truncated title still contributes its full text width as
    // max-content and pushes the whole page wider than the viewport.
    <section aria-labelledby="recent-title" className="min-w-0 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2
          id="recent-title"
          className="text-base font-semibold tracking-[-0.015em]"
        >
          Latest posts
        </h2>

        {status === "ready" ? (
          <Link
            href="/posts"
            className="group flex shrink-0 items-center gap-1 rounded-sm text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            All posts
            <ArrowUpRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </Link>
        ) : null}
      </div>

      {status === "loading" ? (
        <ul className="overflow-hidden rounded-xl border bg-card">
          {Array.from({ length: 4 }).map((_, index) => (
            <li
              key={index}
              className={`flex items-center gap-3 p-4 ${index > 0 ? "border-t" : ""}`}
            >
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </li>
          ))}
        </ul>
      ) : status === "unavailable" ? (
        <PanelMessage tone="unavailable">
          The latest posts could not be loaded.
        </PanelMessage>
      ) : status === "empty" ? (
        <PanelMessage
          action={
            isSignedIn
              ? { label: "Write the first post", href: "/posts/create" }
              : { label: "Create an account to post", href: "/auth/register" }
          }
        >
          {isSignedIn
            ? "Nothing here yet. Nothing has been written on this board."
            : "Nothing here yet. The board is empty, so the first post is yours to write."}
        </PanelMessage>
      ) : (
        <ul className="settle overflow-hidden rounded-xl border bg-card">
          {shown.map((post, index) => {
            const comments = post.commentsCount ?? 0;

            return (
              <li key={post.id} className={index > 0 ? "border-t" : undefined}>
                <Link
                  href={`/posts/${post.id}`}
                  className="flex items-start gap-3 p-4 transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <UserAvatar
                    id={post.user.id}
                    username={post.user.username}
                    hasAvatar={post.user.hasAvatar}
                    avatarUpdatedAt={post.user.avatarUpdatedAt}
                    className="mt-0.5 size-8 shrink-0"
                    fallbackClassName="bg-muted text-xs font-medium text-foreground"
                  />

                  <span className="min-w-0 flex-1 space-y-1.5">
                    {/* Two lines rather than an ellipsis: a compact list still
                        has to say what the post is, and a title cut at one line
                        on a phone loses the part that identifies it. */}
                    <span className="line-clamp-2 font-medium leading-snug">
                      {post.title}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                      <CategoryBadge
                        name={post.category.name}
                        color={post.category.color}
                      />
                      <span className="min-w-0 truncate">
                        {post.user.username}
                      </span>
                      {post.createdAt ? (
                        <time
                          dateTime={new Date(post.createdAt).toISOString()}
                          className="shrink-0"
                        >
                          {formatRelativeTime(post.createdAt)}
                        </time>
                      ) : null}
                    </span>
                  </span>

                  <span
                    className="mt-0.5 flex shrink-0 items-center gap-1 text-xs text-muted-foreground"
                    aria-label={`${comments} ${comments === 1 ? "comment" : "comments"}`}
                  >
                    <MessageCircle className="size-3.5" aria-hidden />
                    <span className="tabular-nums">{comments}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default RecentActivity;
