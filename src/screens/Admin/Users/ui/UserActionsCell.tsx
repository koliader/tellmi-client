"use client";

import { useState, FC } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Ban, Loader2, MoreVertical, Undo2 } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { UsersApiService } from "@/src/share/api/UsersApiService";
import { IQueryError } from "@/src/share/api/model/api";
import { IUserRes } from "@/src/share/api/model/users";
import { tokenStorage } from "@/src/share/api/tokenStorage";

interface UserActionsCellProps {
  user: IUserRes;
}

const usersApi = new UsersApiService();

export const UserActionsCell: FC<UserActionsCellProps> = ({ user }) => {
  const queryClient = useQueryClient();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // The API omits isBlocked when the account is not blocked, so a missing
  // value means false.
  const isBlocked = user.isBlocked ?? false;
  const isSelf = tokenStorage.getPayload()?.id === user.id;

  const mutation = useMutation<
    IUserRes,
    AxiosError<IQueryError>,
    { id: string; isBlocked: boolean }
  >({
    mutationFn: ({ id, isBlocked: next }) => usersApi.setBlocked(id, next),
    onSuccess: (updated) => {
      setIsConfirmOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.add({
        type: "success",
        title: updated.isBlocked ? "User blocked" : "User unblocked",
        description: updated.isBlocked
          ? `${updated.username} can no longer sign in, and their sessions were revoked.`
          : `${updated.username} can sign in again.`,
      });
    },
    onError: (error) => {
      toast.add({
        type: "error",
        title: isBlocked ? "Unblock user error" : "Block user error",
        description:
          error.response?.data?.error ?? "Failed to update the account",
      });
    },
  });

  // Blocking your own account would lock you out of this page, and the
  // backend rejects it too.
  if (isSelf) {
    return <span className="text-xs text-muted-foreground">You</span>;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="cursor-pointer"
              aria-label={`Actions for ${user.username}`}
            />
          }
        >
          <MoreVertical className="size-4" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setIsConfirmOpen(true)}
            className="cursor-pointer"
          >
            {isBlocked ? (
              <>
                <Undo2 className="size-4" aria-hidden />
                Unblock
              </>
            ) : (
              <>
                <Ban className="size-4" aria-hidden />
                Block
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isBlocked ? "Unblock user?" : "Block user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isBlocked ? (
                <>
                  {user.username} will be able to sign in again.
                </>
              ) : (
                <>
                  {user.username} will not be able to sign in, and their
                  existing sessions will be revoked immediately.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="cursor-pointer"
              disabled={mutation.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                mutation.mutate({ id: user.id, isBlocked: !isBlocked })
              }
              disabled={mutation.isPending}
              className="cursor-pointer"
            >
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : isBlocked ? (
                "Unblock"
              ) : (
                "Block"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
