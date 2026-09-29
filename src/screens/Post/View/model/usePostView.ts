"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

  const createCommentMutation = useMutation<
    void,
    AxiosError<IQueryError>,
    string
  >({
    mutationFn: (comment) =>
      commentsApi.create({ comment, postId: Number(postId) }),
    onSuccess: async () => {
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
      // The post is gone, so drop every cached read of it and leave the feed.
      queryClient.removeQueries({ queryKey: postKey(postId) });
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      router.push("/posts");
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
    createComment: (comment) => createCommentMutation.mutate(comment),
    isCreatingComment: createCommentMutation.isPending,
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
