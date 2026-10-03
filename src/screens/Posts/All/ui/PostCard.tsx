"use client";

import { FC } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { CategoryBadge } from "@/src/share/ui/CategoryBadge";
import { formatRelativeTime } from "@/src/share/lib/formatRelativeTime";
import { IPostRow } from "@/src/share/api/model/posts";
import { UserAvatar } from "@/src/share/ui/UserAvatar";

interface PostCardProps {
  post: IPostRow;
}

/**
 * One post in the feed.
 *
 * `settle` is what makes an appended batch legible. Infinite scroll adds rows
 * with no other signal -- the page simply grows, and a visitor who has not
 * scrolled far enough to notice finds new posts where there were none, with
 * nothing saying whether they scrolled past them or they arrived on their own.
 * Each card fades up over a few pixels as it mounts, so a batch reads as a
 * batch. No delay between them: the rows came from one request and should
 * arrive as one gesture, not as a queue.
 */
export const PostCard: FC<PostCardProps> = ({ post }) => {
  const commentsCount = post.commentsCount ?? 0;

  return (
    // The whole card is one link, so the entire surface is clickable. The
    // inner elements are plain spans rather than links to avoid nesting
    // interactive elements, which breaks keyboard and screen-reader
    // navigation.
    <Link
      href={`/posts/${post.id}`}
      className="settle flex cursor-pointer flex-col gap-3 rounded-lg border bg-card p-4 text-card-foreground transition-colors hover:border-border/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <CategoryBadge
        name={post.category.name}
        color={post.category.color}
      />

      <h2 className="text-lg font-semibold leading-snug">{post.title}</h2>

      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {post.description}
      </p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserAvatar
            id={post.user.id}
            username={post.user.username}
            hasAvatar={post.user.hasAvatar}
            avatarUpdatedAt={post.user.avatarUpdatedAt}
            className="size-6"
            fallbackClassName="bg-muted text-xs font-medium text-foreground"
          />
          <span className="text-foreground/90">{post.user.username}</span>
          {post.createdAt ? (
            <>
              <span aria-hidden>·</span>
              <span>{formatRelativeTime(post.createdAt)}</span>
            </>
          ) : null}
        </div>

        <span
          className="flex items-center gap-1.5 text-sm text-muted-foreground"
          aria-label={`${commentsCount} ${commentsCount === 1 ? "comment" : "comments"}`}
        >
          <MessageCircle className="size-4" aria-hidden />
          <span>{commentsCount}</span>
        </span>
      </div>
    </Link>
  );
};
