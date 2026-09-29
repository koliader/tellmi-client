"use client";

import { FC, useState } from "react";
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
import { formatRelativeTime } from "@/src/share/lib/formatRelativeTime";
import { ICommentRow } from "@/src/share/api/model/comments";

interface CommentItemProps {
  comment: ICommentRow;
  /** Rendered only when the signed-in user may edit or delete this comment. */
  canModify: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  onEdit: (comment: string) => void;
  onDelete: () => void;
}

export const CommentItem: FC<CommentItemProps> = ({
  comment,
  canModify,
  isSaving,
  isDeleting,
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
    <li className="flex items-start gap-3">
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground"
      >
        {comment.user.username?.charAt(0).toUpperCase() ?? "?"}
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
              <span className="text-sm font-medium">
                {comment.user.username}
              </span>
              {comment.createdAt ? (
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(comment.createdAt)}
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
            <p className="mt-0.5 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
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
