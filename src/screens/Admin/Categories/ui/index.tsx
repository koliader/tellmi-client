"use client";

import { toast } from "@/components/ui/toast";
import { CreateCategoryForm } from "@/src/feature/CreateCategoryForm";
import { CategoriesApiService } from "@/src/share/api/CategoriesApiService";
import { IQueryError } from "@/src/share/api/model/api";
import { ICategory } from "@/src/share/api/model/categories";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useEffect } from "react";
import { categoryCreationStore } from "../model/store";

export const AdminCategories = () => {
  const store = categoryCreationStore();
  const api = new CategoriesApiService();
  const { data, error, refetch } = useQuery<
    ICategory[],
    AxiosError<IQueryError>
  >({
    queryKey: ["categories"],
    queryFn: api.list,
  });

  useEffect(() => {
    if (error) {
      toast.add({
        type: "error",
        title: "Categories error",
        description: "Error on getting categories list!",
      });
    }
    // console.log(data);
  }, [error, data]);
  useEffect(() => {
    if (store.isReload) {
      refetch();
      store.setIsReload(false);
    }
  }, [store.isReload]);
  return (
    <>
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-zinc-400">
            {data ? data.length : 0} categories
          </p>
        </div>

        <CreateCategoryForm />
      </div>
    </>
  );
};
