"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useUndo } from "@/src/share/ui/UndoProvider";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { CommentsApiService } from "@/src/share/api/CommentsApiService";
import { PostsApiService } from "@/src/share/api/PostsApiService";
import { tokenStorage } from "@/src/share/api/tokenStorage";
import { IQueryError } from "@/src/share/api/model/api";
import { ICommentRow, IEditCommentReq } from "@/src/share/api/model/comments";
import { IPostRow } from "@/src/share/api/model/posts";
import { ERole } from "@/src/share/types/token";

const postsApi = new PostsApiService();
const commentsApi = new CommentsApiService();

/** Key helpers, so mutations invalidate exactly the same entries. */
const postKey = (id: string) => ["post", id] as const;
const commentsKey = (id: string) => ["post", id, "comments"] as const;

export interface IUsePostView {
  post: IPostRow | undefined;
  comments: ICommentRow[];
  isPending: boolean;
  isCommentsPending: boolean;
  notFound: boolean;
  error: AxiosError<IQueryError> | null;
  /** True when the signed-in user authored the post or is an admin. */
  canManage: boolean;
  isSignedIn: boolean;
  /** Whether the signed-in user may edit or delete the given comment. */
  canModifyComment: (comment: ICommentRow) => boolean;
  createComment: (comment: string) => void;
  isCreatingComment: boolean;
  /**
   * The id of the comment this visitor just wrote, or null once its
   * acknowledgement has finished.
   *
   * Posting a comment clears the box and refetches the thread, and in the gap
   * between those two nothing at all indicates the post went anywhere. This is
   * the one piece of state that can tell the thread which row to mark, so it
   * carries the id the server assigned rather than anything inferred from the
   * order of the list.
   */
  justPostedCommentId: number | null;
  /** Retires the acknowledgement. Called by the thread once the row is shown. */
  clearJustPostedComment: () => void;
  editComment: (id: number, comment: string) => void;
  isEditingComment: (id: number) => boolean;
  deleteComment: (id: number) => void;
  deletingCommentId: number | null;
  deletePost: () => void;
  isDeletingPost: boolean;
}

export const usePostView = (postId: string): IUsePostView => {
  const router = useRouter();
  const queryClient = useQueryClient();
  // Layout-level, so the bar survives the redirect below.
  const { offer: offerUndo } = useUndo();

  const {
    data: post,
    isPending,
    error,
  } = useQuery<IPostRow, AxiosError<IQueryError>>({
    queryKey: postKey(postId),
    queryFn: () => postsApi.getById(postId),
    enabled: Boolean(postId),
  });

  const { data: comments, isPending: isCommentsPending } = useQuery<
    ICommentRow[],
    AxiosError<IQueryError>
  >({
    queryKey: commentsKey(postId),
    queryFn: () => commentsApi.listByPost(postId),
    enabled: Boolean(postId),
  });

  // See the interface: the row to mark as newly written, and the hand-off that
  // retires it once the thread has had time to show it.
  const [justPostedCommentId, setJustPostedCommentId] = useState<number | null>(
    null,
  );
  const clearJustPostedComment = useCallback(() => setJustPostedCommentId(null), []);

  const createCommentMutation = useMutation<
    { id?: number },
    AxiosError<IQueryError>,
    string
  >({
    mutationFn: (comment) =>
      commentsApi.create({ comment, postId: Number(postId) }),
    onSuccess: async (created) => {
      // A malformed answer is treated as no answer: no row gets marked, which
      // is the quiet failure, rather than a row that does not exist getting an
      // acknowledgement aimed at it.
      if (typeof created?.id === "number" && created.id > 0) {
        setJustPostedCommentId(created.id);
      }

      // The thread and the post's comment counter both change.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: commentsKey(postId) }),
        queryClient.invalidateQueries({ queryKey: postKey(postId) }),
      ]);
    },
  });

  const deletePostMutation = useMutation<void, AxiosError<IQueryError>, void>({
    mutationFn: () => postsApi.remove(postId),
    onSuccess: async () => {
      /*
       * The page is left immediately. The post is unreadable the moment the
       * request returns, so staying on it would show a 404 to someone who just
       * pressed a button that appeared to work -- and the undo bar is rendered
       * outside the router, so it survives the navigation.
       */
      queryClient.removeQueries({ queryKey: postKey(postId) });
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      router.push("/posts");

      /*
       * Offered after the redirect, not before, so the bar is already on screen
       * where the reader lands rather than appearing over a page they are leaving.
       */
      offerUndo("Post deleted", async () => {
        await postsApi.restore(postId);
        // Drop the negative cache entry the delete left behind, or a later visit
        // would re-fetch into a query marked fresh and show the post as missing
        // for the rest of the session.
        queryClient.removeQueries({ queryKey: postKey(postId) });
        await queryClient.invalidateQueries({ queryKey: ["posts"] });
      });
    },
  });

  const editCommentMutation = useMutation<
    void,
    AxiosError<IQueryError>,
    IEditCommentReq
  >({
    mutationFn: (req) => commentsApi.edit(req),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: commentsKey(postId) });
    },
  });

  const deleteCommentMutation = useMutation<
    void,
    AxiosError<IQueryError>,
    number
  >({
    mutationFn: (id) => commentsApi.remove(id),
    onSuccess: async () => {
      // The thread and the post's comment counter both change.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: commentsKey(postId) }),
        queryClient.invalidateQueries({ queryKey: postKey(postId) }),
      ]);
    },
  });

  const payload = tokenStorage.getPayload();
  const isSignedIn = Boolean(payload);
  const isAdmin = payload?.role === ERole.Admin;
  const canManage = Boolean(
    post && payload && (isAdmin || payload.id === post.user.id),
  );

  return {
    post,
    comments: comments ?? [],
    isPending,
    isCommentsPending,
    notFound: error?.response?.status === 404,
    error,
    canManage,
    isSignedIn,
    canModifyComment: (comment) =>
      Boolean(payload) && (isAdmin || payload?.id === comment.user.id),
    createComment: (comment) => {
      // Cleared before the new request rather than after it, so a second post
      // cannot leave the previous row still marked while its own is in flight.
      setJustPostedCommentId(null);
      createCommentMutation.mutate(comment);
    },
    isCreatingComment: createCommentMutation.isPending,
    justPostedCommentId,
    clearJustPostedComment,
    editComment: (id, comment) => editCommentMutation.mutate({ id, comment }),
    isEditingComment: (id) =>
      editCommentMutation.isPending && editCommentMutation.variables?.id === id,
    deleteComment: (id) => deleteCommentMutation.mutate(id),
    deletingCommentId: deleteCommentMutation.isPending
      ? (deleteCommentMutation.variables ?? null)
      : null,
    deletePost: () => deletePostMutation.mutate(),
    isDeletingPost: deletePostMutation.isPending,
  };
};
