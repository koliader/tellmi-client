"use client";

import { FC, FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ErrorLabel } from "@/src/share/ui/ErrorLabel";

interface CommentComposerProps {
  isSignedIn: boolean;
  isPending: boolean;
  onSubmit: (comment: string) => void;
}

const MAX_LENGTH = 2000;

export const CommentComposer: FC<CommentComposerProps> = ({
  isSignedIn,
  isPending,
  onSubmit,
}) => {
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = comment.trim();
    if (!trimmed) {
      setError("Comment cannot be empty.");
      return;
    }

    setError(null);
    onSubmit(trimmed);
    setComment("");
  };

  if (!isSignedIn) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Sign in to join the conversation.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="Share your thoughts"
        maxLength={MAX_LENGTH}
        rows={4}
        aria-label="Write a comment"
        aria-invalid={error ? true : undefined}
      />
      {error ? <ErrorLabel error={error} /> : null}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isPending}
          className="cursor-pointer"
        >
          {isPending ? "Posting…" : "Post comment"}
        </Button>
      </div>
    </form>
  );
};
