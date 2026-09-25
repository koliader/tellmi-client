"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { CategoriesApiService } from "@/src/share/api/CategoriesApiService";
import { IQueryError } from "@/src/share/api/model/api";
import {
  ICategory,
  IEditCategoryReq,
} from "@/src/share/api/model/categories";
import { categoryEditStore } from "@/src/screens/Admin/Categories/model/editStore";

interface CategoryActionsCellProps {
  category: ICategory;
}

/** Row actions: edit (pencil -> check/cross) and delete (bin + confirmation). */
export const CategoryActionsCell = ({ category }: CategoryActionsCellProps) => {
  const api = new CategoriesApiService();
  const queryClient = useQueryClient();
  const { editingId, draftName, startEditing, stopEditing } = categoryEditStore();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const isEditing = editingId === category.id;
  const canAccept = draftName.trim() !== "";

  const editMutation = useMutation<
    void,
    AxiosError<IQueryError>,
    IEditCategoryReq
  >({
    mutationKey: ["edit category"],
    mutationFn: (req: IEditCategoryReq) => api.edit(req),
    onSuccess: () => {
      toast.add({
        title: "Category updated!",
        type: "success",
      });
      stopEditing();
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  const deleteMutation = useMutation<void, AxiosError<IQueryError>, number>({
    mutationKey: ["delete category"],
    mutationFn: (id: number) => api.delete(id),
    onSuccess: () => {
      toast.add({
        title: "Category deleted!",
        type: "success",
      });
      setIsDeleteOpen(false);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  useEffect(() => {
    if (editMutation.error) {
      toast.add({
        type: "error",
        title: "Category edit error",
        description:
          editMutation.error.response?.data?.error ?? "Failed to update category",
      });
    }
  }, [editMutation.error]);

  useEffect(() => {
    if (deleteMutation.error) {
      toast.add({
        type: "error",
        title: "Category delete error",
        description:
          deleteMutation.error.response?.data?.error ?? "Failed to delete category",
      });
    }
  }, [deleteMutation.error]);

  if (isEditing) {
    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={!canAccept || editMutation.isPending}
          onClick={() =>
            editMutation.mutate({ id: category.id, name: draftName })
          }
          className="cursor-pointer"
          aria-label="Accept changes"
        >
          <Check className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          disabled={editMutation.isPending}
          onClick={stopEditing}
          className="cursor-pointer"
          aria-label="Cancel editing"
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => startEditing(category.id, category.name)}
          className="cursor-pointer"
          aria-label={`Edit ${category.name}`}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsDeleteOpen(true)}
          className="cursor-pointer text-destructive hover:text-destructive"
          aria-label={`Delete ${category.name}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              Category “{category.name}” will be permanently removed. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(category.id)}
              disabled={deleteMutation.isPending}
              className="cursor-pointer"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};