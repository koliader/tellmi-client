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
import { formatRelativeTime } from "@/src/share/lib/formatRelativeTime";
import { usePostView } from "../model/usePostView";
import { CommentThread } from "./CommentThread";
import { CommentComposer } from "./CommentComposer";

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
        <CategoryBadge
          name={post.category.name}
          color={post.category.color}
        />

        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {post.title}
        </h1>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium text-foreground"
            >
              {post.user.username?.charAt(0).toUpperCase() ?? "?"}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {post.user.username}
              </span>
              {post.createdAt ? (
                <span className="text-xs text-muted-foreground">
                  Posted {formatRelativeTime(post.createdAt)}
                </span>
              ) : null}
            </div>
          </div>

          {canManage ? (
            <div className="flex items-center gap-1">
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
            </div>
          ) : null}
        </div>

        <div className="mt-2 flex flex-col gap-4 text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">
          {post.description}
        </div>
      </article>

      <section className="flex flex-col gap-4 border-t pt-6">
        <h2 className="text-lg font-semibold">Comments ({commentsCount})</h2>

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
          onEdit={editComment}
          onDelete={deleteComment}
        />
      </section>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              “{post.title}” and all of its comments will be permanently
              removed. This action cannot be undone.
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
