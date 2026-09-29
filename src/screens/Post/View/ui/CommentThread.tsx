"use client";

import { FC } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ICommentRow } from "@/src/share/api/model/comments";
import { CommentItem } from "./CommentItem";

interface CommentThreadProps {
  comments: ICommentRow[];
  isPending: boolean;
  canModifyComment: (comment: ICommentRow) => boolean;
  isEditingComment: (id: number) => boolean;
  deletingCommentId: number | null;
  onEdit: (id: number, comment: string) => void;
  onDelete: (id: number) => void;
}

const SKELETON_KEYS = [0, 1, 2];

export const CommentThread: FC<CommentThreadProps> = ({
  comments,
  isPending,
  canModifyComment,
  isEditingComment,
  deletingCommentId,
  onEdit,
  onDelete,
}) => {
  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        {SKELETON_KEYS.map((key) => (
          <div key={key} className="flex items-start gap-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!comments.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No comments yet. Be the first to reply.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          canModify={canModifyComment(comment)}
          isSaving={isEditingComment(comment.id)}
          isDeleting={deletingCommentId === comment.id}
          onEdit={(text) => onEdit(comment.id, text)}
          onDelete={() => onDelete(comment.id)}
        />
      ))}
    </ul>
  );
};
