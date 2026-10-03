"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryBadge } from "@/src/share/ui/CategoryBadge";
import { formatRelativeTime } from "@/src/share/lib/formatRelativeTime";
import { PostCard } from "@/src/screens/Posts/All/ui/PostCard";
import { ICommentRow } from "@/src/share/api/model/comments";
import { IPostRow } from "@/src/share/api/model/posts";
import {
  ActivityResult,
  useProfileComments,
  useProfilePosts,
} from "../model/useProfileActivity";

/**
 * One comment in the comments tab.
 *
 * Shows the thread it belongs to, because a comment on its own says nothing
 * about where it was written -- making the reader open each one to find out
 * would leave the tab useless for skimming. The post title is the link.
 */
const CommentCard = ({ comment }: { comment: ICommentRow }) => {
  const post = comment.post;
  const category = post?.category;

  return (
    <Card className="gap-3 py-4">
      <CardContent className="flex flex-col gap-2 px-4">
        {category ? (
          <CategoryBadge name={category.name} color={category.color} />
        ) : null}

        {post ? (
          <Link
            href={`/posts/${comment.postId}`}
            className="text-sm font-semibold leading-snug hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {post.title}
          </Link>
        ) : null}

        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {comment.comment}
        </p>

        <p className="text-xs text-muted-foreground">
          {comment.createdAt ? formatRelativeTime(comment.createdAt) : null}
        </p>
      </CardContent>
    </Card>
  );
};

/** The empty state for a tab with nothing in it. */
const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
    {children}
  </p>
);

/** The failure state, with a way out. */
const Failed = ({ message }: { message: string }) => (
  <div
    role="alert"
    className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-10 text-center"
  >
    <AlertCircle className="size-5 text-destructive" />
    <p className="text-sm text-destructive">{message}</p>
  </div>
);

/**
 * A "load more" control.
 *
 * A real button rather than an infinite scroll, because these lists are the
 * subject of the page rather than a feed someone is scrolling through: someone
 * looking for a comment they remember writing wants to page deliberately, and
 * auto-loading under them makes the list move while they are reading it.
 *
 * Focusable and labelled, so it is reachable by keyboard. A div with an onClick
 * is not.
 */
const LoadMore = <T,>({ page }: { page: ActivityResult<T> }) => {
  if (page.error) {
    return <Failed message={page.error} />;
  }
  if (!page.hasMore) {
    return null;
  }
  return (
    <div className="flex justify-center pt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={page.loadMore}
        disabled={page.isFetching}
      >
        {page.isFetching ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : null}
        {page.isFetching ? "Loading" : "Load more"}
      </Button>
    </div>
  );
};

/** Skeleton rows, shaped like the content they stand in for. */
const ListSkeleton = ({ rows }: { rows: number }) => (
  <div className="flex flex-col gap-3" aria-hidden>
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-28 w-full rounded-lg" />
    ))}
  </div>
);

/**
 * The posts and comments tabs.
 *
 * Both queries are mounted and running from the start, so switching tabs shows
 * data rather than a spinner. The alternative -- fetching on selection -- costs a
 * round trip on every first visit to a tab, which is the visit that matters.
 *
 * `isMe` only changes the wording of the empty states. The same component serves
 * your own profile and someone else's, so there is one list implementation to
 * keep correct rather than two that can disagree.
 */
export const ProfileActivity = ({
  userId,
  isMe,
  includeComments = true,
  panelsOnly = false,
}: {
  userId: string;
  isMe: boolean;
  /**
   * Whether to offer the comments tab at all.
   *
   * Off on someone else's profile: a stranger's replies are noise there, and a
   * tab bar with a single entry is a control that does not control anything. The
   * comments query is not merely hidden in that case -- it is never started, so
   * viewing a profile costs one request rather than two.
   */
  includeComments?: boolean;
  /**
   * When set, return only the tab panels and let the caller own the Tabs root
   * and the tab bar.
   *
   * Needed because your own profile has a third tab -- the edit form -- and the
   * bar has to list all three. The panels cannot be lifted out on their own
   * without duplicating the queries, so this component renders the same markup
   * into a caller-provided Tabs instead: the queries and the rows stay here, and
   * only the chrome moves.
   */
  panelsOnly?: boolean;
}) => {
  const posts = useProfilePosts(userId);
  const comments = useProfileComments(userId, includeComments);

  // Counts for the tab labels. Fetched rather than summed from the loaded rows,
  // so a tab says "40" while showing 20 of them instead of counting what happens
  // to be on screen.
  const postRows = useMemo(() => posts.rows as IPostRow[], [posts.rows]);
  const commentRows = useMemo(
    () => comments.rows as ICommentRow[],
    [comments.rows],
  );

  const postsTab = (
    <TabsTrigger value="posts">
      Posts
      {posts.totalCount > 0 ? (
        <span className="text-xs tabular-nums opacity-70">
          {posts.totalCount}
        </span>
      ) : null}
    </TabsTrigger>
  );

  const commentsTab = (
    <TabsTrigger value="comments">
      Comments
      {comments.totalCount > 0 ? (
        <span className="text-xs tabular-nums opacity-70">
          {comments.totalCount}
        </span>
      ) : null}
    </TabsTrigger>
  );

  /*
   * With one entry there is nothing to switch between, so the tab bar is dropped
   * and the list rendered on its own. A one-item tab strip is a control that
   * cannot be operated, and it costs vertical space that the posts themselves
   * would rather have.
   */
  const postsPanel = (
    <>
      {posts.isLoading ? (
        <ListSkeleton rows={3} />
      ) : posts.rows.length === 0 ? (
        <Empty>
          {isMe
            ? "You have not posted yet."
            : "This member has not posted yet."}
        </Empty>
      ) : (
        <>
          {postRows.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          <LoadMore page={posts} />
        </>
      )}
    </>
  );

  const commentsPanel = (
    <>
      {comments.isLoading ? (
        <ListSkeleton rows={3} />
      ) : comments.rows.length === 0 ? (
        <Empty>
          {isMe
            ? "You have not commented yet."
            : "This member has not commented yet."}
        </Empty>
      ) : (
        <>
          {commentRows.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
          <LoadMore page={comments} />
        </>
      )}
    </>
  );

  // A single panel, with no tab strip: on someone else's profile there is nothing
  // to switch to, and a one-entry tab bar is a control that cannot be operated.
  if (!includeComments) {
    return <div className="flex flex-col gap-3">{postsPanel}</div>;
  }

  // Only the panels, for a page whose tab bar is wider than posts and comments.
  if (panelsOnly) {
    return (
      <>
        <TabsContent value="posts" className="flex flex-col gap-3">
          {postsPanel}
        </TabsContent>
        <TabsContent value="comments" className="flex flex-col gap-3">
          {commentsPanel}
        </TabsContent>
      </>
    );
  }

  return (
    <Tabs defaultValue="posts" className="gap-4">
      <TabsList>
        {postsTab}
        {commentsTab}
      </TabsList>

      <TabsContent value="posts" className="flex flex-col gap-3">
        {postsPanel}
      </TabsContent>

      <TabsContent value="comments" className="flex flex-col gap-3">
        {commentsPanel}
      </TabsContent>
    </Tabs>
  );
};
