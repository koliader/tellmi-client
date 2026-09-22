"use client";

import { useEffect, useState, type FC } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  FileText,
  LogOut,
  MessageSquareText,
  Tags,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { tokenStorage } from "@/src/share/api/tokenStorage";
import type { IPayload } from "@/src/share/types/token";
import { UsersApiService } from "@/src/share/api/UsersApiService";
import { IUserRes } from "@/src/share/api/model/users";
import { IQueryError } from "@/src/share/api/model/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
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
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "Manage",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/categories", label: "Categories", icon: Tags },
    ],
  },
  {
    label: "Content",
    items: [{ href: "/admin/posts", label: "Posts", icon: FileText }],
  },
];

export const AdminSidebar: FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [payload, setPayload] = useState<IPayload | null>(null);

  useEffect(() => {
    setPayload(tokenStorage.getPayload());
  }, []);

  const usersApi = new UsersApiService();
  const { data, isLoading, error } = useQuery<
    IUserRes,
    AxiosError<IQueryError>
  >({
    queryKey: ["getMe"],
    queryFn: () => usersApi.getMe(),
    enabled: !!payload,
  });

  const handleLogout = () => {
    tokenStorage.clearTokens();
    toast.add({
      title: "Logout",
      description: "You have been logged out.",
    });
    router.replace("/auth/login");
  };

  return (
    <>
      <nav className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-background">
        {/* Brand */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-black">
              <MessageSquareText className="size-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              Tellmi Admin
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            nativeButton={false}
            render={<Link href="/" />}
            className="cursor-pointer text-muted-foreground hover:text-foreground"
            aria-label="Visit site"
            title="Visit site"
          >
            <ExternalLink className="size-4" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="px-2.5 pb-1.5 pt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                        active
                          ? "bg-secondary font-medium text-secondary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <item.icon className="size-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Account */}
        <div className="shrink-0 px-3 pb-3">
          <Separator className="mb-3 mt-2" />
          <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
            <Avatar className="size-9">
              {isLoading && !error ? (
                <Skeleton className="size-9 rounded-full" />
              ) : (
                <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                  {data?.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0 flex-1">
              {isLoading && !error ? (
                <Skeleton className="h-4 w-20" />
              ) : (
                <p className="truncate text-sm font-medium">{data?.username}</p>
              )}
              <p className="text-xs text-muted-foreground">Admin</p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsLogoutOpen(true)}
              className="shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
              aria-label="Logout"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </div>
      </nav>

      <AlertDialog open={isLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of the admin panel?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to manage the panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsLogoutOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="cursor-pointer"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
