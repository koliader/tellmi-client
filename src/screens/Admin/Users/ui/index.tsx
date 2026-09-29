"use client";

import { useEffect, FC } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { toast } from "@/components/ui/toast";
import { DataTable, dataTableFeatures } from "@/src/share/ui/DataTable";
import { UsersApiService } from "@/src/share/api/UsersApiService";
import { IQueryError } from "@/src/share/api/model/api";
import { IUserRes } from "@/src/share/api/model/users";
import { ERole } from "@/src/share/types/token";
import { UserCell } from "./UserCell";
import { RoleCell } from "./RoleCell";
import { BlockedCell } from "./BlockedCell";
import { UserActionsCell } from "./UserActionsCell";
import { JoinedCell } from "./JoinedCell";

const usersApi = new UsersApiService();

const EMPTY_USERS: IUserRes[] = [];

/** Renders an absent email as a muted dash. */
const emailCell = (email?: string) =>
  email ? (
    <span className="text-sm">{email}</span>
  ) : (
    <span className="text-sm text-muted-foreground">—</span>
  );

const helper = createColumnHelper<typeof dataTableFeatures, IUserRes>();
const columns = helper.columns([
  helper.accessor("username", {
    header: "User",
    cell: ({ row }) => <UserCell user={row.original} />,
  }),
  helper.accessor("email", {
    header: "Email",
    cell: ({ row }) => emailCell(row.original.email),
  }),
  helper.accessor("role", {
    header: "Role",
    cell: ({ row }) => <RoleCell role={row.original.role} />,
  }),
  helper.accessor("createdAt", {
    header: "Joined",
    cell: ({ row }) => <JoinedCell createdAt={row.original.createdAt} />,
  }),
  helper.accessor("isBlocked", {
    header: "Blocked",
    // The API omits the field when false, so normalise it to a real boolean:
    // the sorting function compares booleans and a column accessor must not
    // mix undefined in with them.
    cell: ({ row }) => (
      <BlockedCell isBlocked={row.original.isBlocked ?? false} />
    ),
    sortFn: "booleanOrder",
  }),
  helper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => <UserActionsCell user={row.original} />,
  }),
]);

export const AdminUsers = () => {
  const { data, error, isPending } = useQuery<IUserRes[], AxiosError<IQueryError>>({
    queryKey: ["users"],
    queryFn: () => usersApi.list(),
  });

  useEffect(() => {
    if (error) {
      toast.add({
        type: "error",
        title: "Users error",
        description: "Error on getting users list!",
      });
    }
  }, [error]);

  const users = data ?? EMPTY_USERS;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          {isPending
            ? "…"
            : `${users.length} registered ${users.length === 1 ? "user" : "users"}`}
        </p>
      </div>

      <DataTable
        columns={columns}
        data={users}
        searchColumn="username"
        pageSize={10}
      />
    </div>
  );
};
