"use client";

import { useCallback, useEffect, useState, type FC } from "react";
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
import { tokenStorage } from "@/src/share/api/tokenStorage";
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
import { useCurrentUser } from "@/src/share/api/useCurrentUser";

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

interface AdminSidebarProps {
  /** Controlled drawer state, driven by the compact mobile header. */
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const AdminSidebar: FC<AdminSidebarProps> = ({
  isOpen: isOpenProp,
  onOpenChange,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);

  // Falls back to internal state so the sidebar still works standalone.
  const isControlled = isOpenProp !== undefined;
  const isOpen = isControlled ? isOpenProp : internalOpen;
  const setIsOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  // Profile, shared with the navbar so an expired or blocked session is
  // handled in one place.
  const { user, initial, isLoadingProfile: isLoading } = useCurrentUser();

  const handleLogout = () => {
    tokenStorage.clearTokens();
    toast.add({
      title: "Logout",
      description: "You have been logged out.",
    });
    router.replace("/auth/login");
  };

  const sidebarContent = (
    <nav className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-background">
      {/* Brand */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
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
                    onClick={() => setIsOpen(false)}
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
            {isLoading ? (
              <Skeleton className="size-9 rounded-full" />
            ) : (
              <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                {initial}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0 flex-1">
            {isLoading ? (
              <Skeleton className="h-4 w-20" />
            ) : (
              <p className="truncate text-sm font-medium">
                {user?.username || "—"}
              </p>
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
  );

  return (
    <>
      {/*
        On phones the sidebar becomes an off-canvas drawer that slides in over
        the content, with a scrim to dismiss it. From `lg` up it is a permanent
        column in the flex row instead.
      */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          isOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!isOpen}
      >
        <button
          type="button"
          aria-label="Close navigation"
          tabIndex={isOpen ? 0 : -1}
          onClick={() => setIsOpen(false)}
          className={cn(
            "absolute inset-0 bg-foreground/40 transition-opacity duration-200",
            isOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-64 max-w-[85vw] shadow-lg transition-transform duration-200",
            isOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          {sidebarContent}
        </div>
      </div>

      <div className="hidden lg:flex">{sidebarContent}</div>

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
