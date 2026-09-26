"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LogOut,
  MessageSquare,
  MessageSquareText,
  Plus,
  ShieldCheck,
} from "lucide-react";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { IQueryError } from "@/src/share/api/model/api";
import { AxiosError } from "axios";
import { UsersApiService } from "@/src/share/api/UsersApiService";
import { IUserRes } from "@/src/share/api/model/users";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { NavAlertDialog } from "./NavAlertDialog";
import { alertDialogStore } from "../model/store";
import { usePathname } from "next/navigation";

export const Navbar = () => {
  // token
  const [payload, setPayload] = useState<IPayload | null>(null);
  useEffect(() => {
    setPayload(tokenStorage.getPayload());
  }, []);

  // pathname
  const pathname = usePathname();

  // store
  const store = alertDialogStore();

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
  }, [error]);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <MessageSquareText className="size-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Tellmi</span>
        </Link>

        <div className="flex items-center justify-center gap-2">
          {payload ? (
            <>
              <Button
                className="duration-200"
                variant={
                  pathname.slice(0, 6) == "/posts" ? "secondary" : "ghost"
                }
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
              <Link href="/posts/create">
                <Button
                  className="flex justify-center items-center cursor-pointer text-xs font-bold"
                  size="sm"
                >
                  <Plus />
                  New post
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="ghost" className="gap-2 px-2" />}
                  className="cursor-pointer"
                >
                  <Badge
                    variant={
                      payload.role === "ADMIN" ? "destructive" : "secondary"
                    }
                    className="text-[10px] px-2.5 py-0"
                  >
                    {payload.role}
                  </Badge>
                  <Avatar className="size-8">
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

                  {payload.role === "ADMIN" && (
                    <>
                      <DropdownMenuItem
                        className="cursor-pointer"
                        render={<Link href="/admin" />}
                      >
                        <ShieldCheck className="mr-2 size-4" />
                        Admin panel
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  <DropdownMenuItem
                    onClick={() => store.setIsOpen(true)}
                    variant="destructive"
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 size-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <NavAlertDialog />
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
