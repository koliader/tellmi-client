"use client";

import { useEffect, FC } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PostsApiService } from "@/src/share/api/PostsApiService";
import { tokenStorage } from "@/src/share/api/tokenStorage";
import { IQueryError } from "@/src/share/api/model/api";
import { IPostRow } from "@/src/share/api/model/posts";
import { ERole } from "@/src/share/types/token";
import { PostForm } from "@/src/widgets/PostForm/ui";

const postsApi = new PostsApiService();

interface EditPostPageProps {
  postId: string;
}

type Access = "loading" | "allowed" | "forbidden" | "missing";

export const EditPostPage: FC<EditPostPageProps> = ({ postId }) => {
  const router = useRouter();

  const { data: post, isPending, error } = useQuery<
    IPostRow,
    AxiosError<IQueryError>
  >({
    queryKey: ["post", postId],
    queryFn: () => postsApi.getById(postId),
    enabled: Boolean(postId),
  });

  // The backend re-checks this on save; hiding the form keeps the UI honest
  // and avoids showing a form the user cannot submit.
  const payload = tokenStorage.getPayload();
  let access: Access = "loading";
  if (!isPending) {
    if (error) {
      access = "missing";
    } else if (
      post &&
      payload &&
      (payload.role === ERole.Admin || payload.id === post.user.id)
    ) {
      access = "allowed";
    } else {
      access = "forbidden";
    }
  }

  useEffect(() => {
    if (access === "forbidden" || access === "missing") {
      router.replace(`/posts/${postId}`);
    }
  }, [access, postId, router]);

  if (access === "loading" || isPending || !post) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-9 w-full max-w-2xl" />
        <Skeleton className="h-24 w-full max-w-2xl" />
      </div>
    );
  }

  return (
    <div>
      <Link
        className="flex items-center gap-1 cursor-pointer hover:-translate-x-1 transition-transform duration-200"
        href={`/posts/${post.id}`}
      >
        <ArrowLeft strokeWidth={1.75} size="16px" />
        <span className="text-sm">Back to post</span>
      </Link>
      <PostForm post={post} />
    </div>
  );
};
