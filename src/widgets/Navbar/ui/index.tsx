"use client";

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
import { useState, useEffect } from "react";
import Link from "next/link";
import { LogOut, MessageSquare } from "lucide-react";
import { tokenStorage } from "@/src/share/api/tokenStorage";
import type { IPayload } from "@/src/share/types/token";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { IQueryError } from "@/src/share/api/model/api";
import { AxiosError } from "axios";
import { UsersApiService } from "@/src/share/api/UsersApiService";
import { IUserRes } from "@/src/share/api/model/users";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [payload, setPayload] = useState<IPayload | null>(null);
  useEffect(() => {
    setPayload(tokenStorage.getPayload());
  }, []);

  // getting user data by token
  const api = new UsersApiService();
  const { data, isLoading, error, isFetched } = useQuery<
    IUserRes,
    AxiosError<IQueryError>
  >({
    queryKey: ["getMe"],
    queryFn: () => api.getMe(),
    enabled: !!payload,
  });
  useEffect(() => {
    if (error) {
      toast.add({
        type: "Error",
        title: "Error to get user",
        description: "Error on getting user profile data!",
      });
    }
    if (isFetched) console.log(data);
  }, [error, isFetched]);

  const handleLogout = () => {
    setIsOpen(false);
    tokenStorage.clearTokens();
    setPayload(null);
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <MessageSquare className="size-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Tellmi</span>
        </Link>

        <div className="flex items-center gap-2">
          {payload ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/posts" />}
              >
                Posts
              </Button>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/categories" />}
              >
                Categories
              </Button>

              <Separator orientation="vertical" className="mx-1 h-6" />

              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" className="gap-2 px-2" />}
                  className="cursor-pointer"
                >
                  <Badge
                    variant={
                      payload.role === "ADMIN" ? "destructive" : "secondary"
                    }
                    className="text-[10px] px-1.5 py-0"
                  >
                    {payload.role}
                  </Badge>
                  <Avatar className="size-8 ">
                    {isLoading && !error ? (
                      <Skeleton className="h-8 w-8 rounded-full" />
                    ) : (
                      <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                        {data!.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    {isLoading && !error ? (
                      <Skeleton className="w-24 h-5" />
                    ) : (
                      <p className="text-sm font-medium">{data!.username}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {payload.role}
                    </p>
                  </div>

                  <DropdownMenuItem
                    onClick={() => setIsOpen(true)}
                    variant="destructive"
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 size-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialog open={isOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      your account from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsOpen(false)}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href="/auth/login" />}
              >
                Login
              </Button>
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href="/auth/register" />}
              >
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
