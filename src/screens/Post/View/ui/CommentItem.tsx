"use client";

import Link from "next/link";
import { FC, useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Loader2, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { UserAvatar } from "@/src/share/ui/UserAvatar";
import { formatRelativeTime } from "@/src/share/lib/formatRelativeTime";
import { ICommentRow } from "@/src/share/api/model/comments";

interface CommentItemProps {
  comment: ICommentRow;
  /** Rendered only when the signed-in user may edit or delete this comment. */
  canModify: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  /** True for the comment this visitor has just written. */
  isJustPosted?: boolean;
  onEdit: (comment: string) => void;
  onDelete: () => void;
}

export const CommentItem: FC<CommentItemProps> = ({
  comment,
  canModify,
  isSaving,
  isDeleting,
  isJustPosted = false,
  onEdit,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.comment);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // The draft is seeded when editing starts and thrown away when it ends, so
  // there is no need to mirror the server value while the textarea is closed.
  const startEditing = () => {
    setDraft(comment.comment);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setDraft(comment.comment);
  };

  const handleSave = () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === comment.comment) {
      cancelEditing();
      return;
    }
    onEdit(trimmed);
    setIsEditing(false);
  };

  return (
    // The negative margin and its matching padding let the wash sit slightly
    // inside the thread's left edge, so a newly written comment is marked as a
    // row rather than as a full-bleed band across the section. They cancel, so
    // the row sits exactly where it did before.
    <li
      className={cn(
        "flex items-start gap-3 rounded-lg -mx-2 px-2",
        isJustPosted && "landed",
      )}
    >
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground"
      >
        <UserAvatar
          id={comment.user.id}
          username={comment.user.username}
          hasAvatar={comment.user.hasAvatar}
          avatarUpdatedAt={comment.user.avatarUpdatedAt}
          className="size-6 shrink-0"
          fallbackClassName="text-xs"
        />
      </span>

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              maxLength={2000}
              autoFocus
              aria-label="Edit comment"
            />
            <div className="flex items-center gap-1">
              <Button
                size="icon-sm"
                onClick={handleSave}
                disabled={isSaving || !draft.trim()}
                className="cursor-pointer"
                aria-label="Save comment"
              >
                {isSaving ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Check className="size-4" aria-hidden />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={cancelEditing}
                disabled={isSaving}
                className="cursor-pointer"
                aria-label="Cancel editing comment"
              >
                <X className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-x-2">
              <Link
                href={`/u/${comment.user.id}`}
                className="rounded text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {comment.user.username}
              </Link>
              {comment.createdAt ? (
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(comment.createdAt)}
                  {/*
                    * The marker, and the only thing that says a thought changed.
                    * Timestamped rather than bare "edited" so a reader can judge how
                    * stale the revision is, and wrapped in a title because the
                    * relative time is too small to read precisely.
                    *
                    * Driven by updatedAt alone: it is zero when the comment has
                    * never been edited, so there is no separate flag that could
                    * claim an edit that did not happen.
                    */}
                  {comment.updatedAt ? (
                    <>
                      {" · "}
                      <span title={`edited ${formatRelativeTime(comment.updatedAt)}`}>
                        edited
                      </span>
                    </>
                  ) : null}
                </span>
              ) : null}

              {canModify ? (
                <span className="ml-auto flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={startEditing}
                    disabled={isDeleting}
                    className="cursor-pointer"
                    aria-label="Edit comment"
                  >
                    <Pencil className="size-3.5" aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setIsDeleteOpen(true)}
                    disabled={isDeleting}
                    className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Delete comment"
                  >
                    {isDeleting ? (
                      <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Trash2 className="size-3.5" aria-hidden />
                    )}
                  </Button>
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 max-w-[68ch] text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
              {comment.comment}
            </p>
          </>
        )}
      </div>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete comment?</AlertDialogTitle>
            <AlertDialogDescription>
              This comment will be permanently removed. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  );
};
