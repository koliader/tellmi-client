"use client";

import { useEffect, useState, FC } from "react";
import Link from "next/link";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toast";
import { BackLink } from "@/src/share/ui/BackLink";
import { CategoryBadge } from "@/src/share/ui/CategoryBadge";
import { UserAvatar } from "@/src/share/ui/UserAvatar";
import { ShareButton } from "@/src/share/ui/ShareButton";
import { formatRelativeTime } from "@/src/share/lib/formatRelativeTime";
import { useCountUp } from "@/src/share/lib/useCountUp";
import { usePostView } from "../model/usePostView";
import { CommentThread } from "./CommentThread";
import { CommentComposer } from "./CommentComposer";

/**
 * How long the newly written comment stays marked.
 *
 * Long enough to be caught in peripheral vision while the eye is still on the
 * composer, short enough that the thread does not look like it is holding
 * something open. Long by design: this is the one moment on the page that
 * confirms an action the visitor took, and it should not be missed.
 */
const LANDED_MS = 1500;

/**
 * The comment count, which counts up.
 *
 * This is the second half of posting a comment. The wash marks which row is
 * yours; this says the conversation got bigger. It matters more here than on
 * the home page because the action is the visitor's own -- posting a reply
 * changes this number, and nothing else on the screen would say so.
 */
const CommentCount: FC<{ count: number }> = ({ count }) => {
  const counted = useCountUp(count);

  return (
    <h2 className="text-lg font-semibold">
      Comments (<span aria-hidden>{`${counted ?? 0}`}</span>
      <span className="sr-only">{count}</span>)
    </h2>
  );
};

interface PostViewPageProps {
  postId: string;
}

export const PostViewPage: FC<PostViewPageProps> = ({ postId }) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const {
    post,
    comments,
    isPending,
    isCommentsPending,
    notFound,
    error,
    canManage,
    isSignedIn,
    canModifyComment,
    createComment,
    isCreatingComment,
    justPostedCommentId,
    clearJustPostedComment,
    editComment,
    isEditingComment,
    deleteComment,
    deletingCommentId,
    deletePost,
    isDeletingPost,
  } = usePostView(postId);

  useEffect(() => {
    if (error && !notFound) {
      toast.add({
        type: "error",
        title: "Post error",
        description: "Error on getting the post!",
      });
    }
  }, [error, notFound]);

  /*
   * Retires the newly-written marker once it has actually been seen.
   *
   * The mutation resolves before the refetched thread arrives, so starting the
   * clock on the mutation would run it out before the row was ever on screen
   * and the acknowledgement would be silently lost on a slow connection. The
   * wait is therefore on the row, not on the request.
   */
  useEffect(() => {
    if (justPostedCommentId === null) {
      return;
    }

    const isOnScreen = comments.some(
      (comment) => comment.id === justPostedCommentId,
    );
    if (!isOnScreen) {
      return;
    }

    const timer = window.setTimeout(clearJustPostedComment, LANDED_MS);
    return () => window.clearTimeout(timer);
  }, [justPostedCommentId, comments, clearJustPostedComment]);

  if (notFound) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          This post does not exist or was deleted.
        </p>
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/posts" />}
          className="cursor-pointer"
        >
          Back to posts
        </Button>
      </div>
    );
  }

  if (isPending || !post) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const commentsCount = post.commentsCount ?? comments.length;

  return (
    <div className="flex flex-col gap-6">
      <BackLink href="/posts" label="Back to posts" />

      <article className="flex flex-col gap-3">
        <CategoryBadge name={post.category.name} color={post.category.color} />

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {post.title}
        </h1>

        <div className="flex items-center justify-between gap-4">
          {/*
            The author block links to their profile. The avatar and the name are
            wrapped together rather than just the name, because the pair reads as
            one thing -- and a name-only link leaves the avatar looking like a
            separate, inert element next to it.
          */}
          <Link
            href={`/u/${post.user.id}`}
            className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <UserAvatar
              id={post.user.id}
              username={post.user.username}
              hasAvatar={post.user.hasAvatar}
              avatarUpdatedAt={post.user.avatarUpdatedAt}
              className="size-9 shrink-0"
              fallbackClassName="bg-muted text-sm font-medium text-foreground"
            />
            <span className="flex flex-col">
              <span className="text-sm font-medium">{post.user.username}</span>
              {post.createdAt ? (
                <span className="text-xs text-muted-foreground">
                  Posted {formatRelativeTime(post.createdAt)}
                </span>
              ) : null}
            </span>
          </Link>

          {/*
            Share is outside the canManage gate on purpose: reading a post and
            passing it on needs no ownership, and a share button that appears only
            on your own posts would make forwarding someone else's the most
            cumbersome case.

            The manage actions stay in their own group, so the two are never
            visually adjacent by accident and a reader's share control is not
            sitting among controls that will delete things.
          */}
          <div className="flex items-center gap-1">
            <ShareButton path={`/posts/${post.id}`} label="post" />

            {canManage ? (
              <>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  nativeButton={false}
                  render={<Link href={`/posts/${post.id}/edit`} />}
                  className="cursor-pointer"
                  aria-label="Edit post"
                >
                  <Pencil className="size-4" aria-hidden />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setIsDeleteOpen(true)}
                  disabled={isDeletingPost}
                  className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete post"
                >
                  {isDeletingPost ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Trash2 className="size-4" aria-hidden />
                  )}
                </Button>
              </>
            ) : null}
          </div>
        </div>

        {/*
          max-w-[68ch] because a measure of characters, not pixels, is what makes
          text tiring: at this container's width a line holds well over 100
          characters, and the eye loses its place returning to the left margin.
          68ch is the usual comfortable range for a single column, and it caps the
          measure on a wide monitor without narrowing the page or the comment
          thread beside it.

          The comment thread gets the same treatment in CommentItem for the same
          reason, and the two are kept in step deliberately -- a post body that is
          comfortable to read and replies to it that are not is a worse page than
          one that is uniformly long.
        */}
        <div className="mt-2 flex max-w-[68ch] flex-col gap-4 text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">
          {post.description}
        </div>
      </article>

      <section className="flex flex-col gap-4 border-t pt-6">
        <CommentCount count={commentsCount} />

        <CommentComposer
          isSignedIn={isSignedIn}
          isPending={isCreatingComment}
          onSubmit={createComment}
        />

        <CommentThread
          comments={comments}
          isPending={isCommentsPending}
          canModifyComment={canModifyComment}
          isEditingComment={isEditingComment}
          deletingCommentId={deletingCommentId}
          justPostedCommentId={justPostedCommentId}
          onEdit={editComment}
          onDelete={deleteComment}
        />
      </section>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              “{post.title}” will be removed from the board, along with its
              comments. You will get a few seconds to undo it afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deletePost}
              disabled={isDeletingPost}
              className="cursor-pointer"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
