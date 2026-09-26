"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { toast } from "@/components/ui/toast";
import { CreateCategoryForm } from "@/src/feature/CreateCategoryForm";
import { DataTable, dataTableFeatures } from "@/src/share/ui/DataTable";
import { CategoriesApiService } from "@/src/share/api/CategoriesApiService";
import { IQueryError } from "@/src/share/api/model/api";
import { ICategory } from "@/src/share/api/model/categories";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useEffect } from "react";
import { CategoryActionsCell } from "./CategoryActionsCell";
import { CategoryNameCell } from "./CategoryNameCell";

const helper = createColumnHelper<typeof dataTableFeatures, ICategory>();
const columns = helper.columns([
  helper.accessor("id", { header: "ID" }),
  helper.accessor("name", {
    header: "Name",
    cell: ({ row }) => <CategoryNameCell category={row.original} />,
  }),
  helper.display({
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <CategoryActionsCell category={row.original} />,
  }),
]);

const EMPTY_CATEGORIES: ICategory[] = [];

export const AdminCategories = () => {
  const api = new CategoriesApiService();

  const { data, error } = useQuery<
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
  }, [error]);

  const categories = data ?? EMPTY_CATEGORIES;

  return (
    <>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-sm text-zinc-400">
            {categories.length} categories
          </p>
        </div>

        <CreateCategoryForm />

        <DataTable
          columns={columns}
          data={categories}
          searchColumn="name"
        />
      </div>
    </>
  );
};