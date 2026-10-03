"use client";
import { Controller, useForm } from "react-hook-form";
import { FC, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { IPostFormValues } from "../types/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorLabel } from "@/src/share/ui/ErrorLabel";
import { CategoryBadge } from "@/src/share/ui/CategoryBadge";
import { CategoriesApiService } from "@/src/share/api/CategoriesApiService";
import { PostsApiService } from "@/src/share/api/PostsApiService";
import { ICategory } from "@/src/share/api/model/categories";
import { IPostRow } from "@/src/share/api/model/posts";
import { IQueryError } from "@/src/share/api/model/api";
import { toast } from "@/components/ui/toast";

const categoriesApi = new CategoriesApiService();
const postsApi = new PostsApiService();

interface PostFormProps {
  /**
   * When set, the form edits that post instead of creating a new one. The
   * parent must only render the form once the post has loaded, so that the
   * default values below are picked up on mount.
   */
  post?: IPostRow;
}

export const PostForm: FC<PostFormProps> = ({ post }) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = Boolean(post);

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<IPostFormValues>({
    mode: "onChange",
    defaultValues: {
      title: post?.title ?? "",
      categoryId: post ? String(post.category.id) : "",
      description: post?.description ?? "",
    },
  });

  const title = watch("title") ?? "";

  const {
    data: categories,
    isPending: isCategoriesPending,
    isError: isCategoriesError,
    refetch: refetchCategories,
  } = useQuery<ICategory[], AxiosError<IQueryError>>({
    queryKey: ["categories"],
    queryFn: () => categoriesApi.list(),
    staleTime: 5 * 60 * 1000,
  });
  useEffect(() => {
    if (!isCategoriesPending) {
      console.log(`categories: ${categories}`);
    }
  }, [categories]);
  const savePost = useMutation<void, AxiosError<IQueryError>, IPostFormValues>({
    mutationFn: async (values) => {
      const payload = {
        title: values.title,
        description: values.description,
        categoryId: Number(values.categoryId),
      };

      if (post) {
        await postsApi.edit({ id: post.id, ...payload });
        return;
      }

      await postsApi.create(payload);
    },
    onSuccess: async () => {
      if (post) {
        // Refresh every cached read of this post before navigating, otherwise
        // the detail page mounts on the stale copy and flashes the old values.
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["post", post.id] }),
          queryClient.invalidateQueries({ queryKey: ["posts"] }),
        ]);
        toast.add({
          type: "success",
          title: "Post updated",
          description: "Your changes have been saved!",
        });
        router.push(`/posts/${post.id}`);
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.add({
        type: "success",
        title: "Post created",
        description: "Your post has been published!",
      });
      router.push("/posts");
    },
    onError: (err) => {
      toast.add({
        type: "error",
        title: post ? "Edit post" : "Create post",
        description: err?.response?.data?.error ?? "Failed to save post",
      });
    },
  });

  const onSubmit = handleSubmit((values) => savePost.mutate(values));

  return (
    <>
      <form onSubmit={onSubmit} className="py-3 max-w-2xl">
        <h1 className="text-3xl font-black">
          {isEditing ? "Edit post" : "New post"}
        </h1>
        <p className="text-zinc-400 text-sm">
          {isEditing
            ? "Update the details of your post."
            : "Share your thoughts with the community."}
        </p>

        <div className="py-3 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <Label className="pl-0.5">Title</Label>
              <span className="text-xs text-zinc-400">{title.length}/120</span>
            </div>
            <Input
              placeholder="Title"
              {...register("title", {
                required: "Title is required",
                maxLength: {
                  value: 120,
                  message: "Title must be 120 characters or fewer",
                },
              })}
            />
            {errors.title && <ErrorLabel error={errors.title.message!} />}
          </div>

          <div className="flex flex-col gap-2">
            <Label className="pl-0.5">
              Category
              {!isCategoriesPending &&
                !isCategoriesError &&
                categories?.length === 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    (categories are empty)
                  </span>
                )}
            </Label>
            <Controller
              control={control}
              name="categoryId"
              rules={{ required: "Please select a category" }}
              render={({ field }) => (
                <Select
                  value={field.value || null}
                  onValueChange={(value) => field.onChange(value ?? "")}
                >
                  <SelectTrigger
                    className="w-full"
                    aria-invalid={errors.categoryId ? true : undefined}
                    disabled={isCategoriesPending || categories?.length === 0}
                  >
                    <SelectValue>
                      {(value) => {
                        if (!value) {
                          return (
                            <span className="text-muted-foreground">
                              {isCategoriesPending
                                ? "Loading categories..."
                                : categories?.length === 0
                                  ? "No categories available"
                                  : "Select a category"}
                            </span>
                          );
                        }
                        const selected = categories?.find(
                          (category) => String(category.id) === value,
                        );
                        return selected ? (
                          <CategoryBadge
                            name={selected.name}
                            color={selected.color}
                          />
                        ) : (
                          value
                        );
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {/*
                        The reserved fallback is filtered out here. It is where the
                        system files a post whose category was deleted, not a topic
                        anybody chose, so offering it would produce posts that belong
                        nowhere on purpose. Filtered on the flag rather than the name,
                        so rewording it cannot silently put it back.
                      */}
                      {categories
                        ?.filter((category) => !category.isFallback)
                        .map((category) => (
                          <SelectItem
                            key={category.id}
                            value={String(category.id)}
                          >
                            <CategoryBadge
                              name={category.name}
                              color={category.color}
                            />
                          </SelectItem>
                        ))}
                      {!isCategoriesPending && categories?.length === 0 && (
                        <SelectItem value="__empty" disabled>
                          No categories available
                        </SelectItem>
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.categoryId && (
              <ErrorLabel error={errors.categoryId.message!} />
            )}
            {isCategoriesError && (
              <div className="flex items-center gap-2 pl-0.5">
                <ErrorLabel error="Failed to load categories" />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => refetchCategories()}
                >
                  Retry
                </Button>
              </div>
            )}
            {!isCategoriesPending &&
              !isCategoriesError &&
              categories?.length === 0 && (
                <p className="text-xs text-zinc-400 pl-0.5">
                  No categories yet — ask an admin to create one.
                </p>
              )}
          </div>

          <div className="flex flex-col gap-2">
            <Label className="pl-0.5">Description</Label>
            <Textarea
              placeholder="Write your post description..."
              rows={5}
              {...register("description", {
                required: "Description is required",
              })}
            />
            {errors.description && (
              <ErrorLabel error={errors.description.message!} />
            )}
          </div>

          <Button
            type="submit"
            disabled={savePost.isPending}
            className="cursor-pointer"
          >
            {savePost.isPending
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
                ? "Save changes"
                : "Create post"}
          </Button>
        </div>
      </form>
    </>
  );
};
