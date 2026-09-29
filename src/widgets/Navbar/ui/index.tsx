"use client";

import Link from "next/link";
import {
  LogOut,
  MessageSquareText,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  Tags,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { NavAlertDialog } from "./NavAlertDialog";
import { alertDialogStore } from "../model/store";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/src/share/ui/ThemeToggle";
import { useTheme } from "@/src/share/lib/useTheme";
import { useCurrentUser } from "@/src/share/api/useCurrentUser";
import { MobileTabBar } from "@/src/widgets/MobileTabBar/ui";
import { useScrollingDown } from "@/src/share/lib/useScrollingDown";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  // Hides the bars on the way down, brings them back on the way up.
  const isScrollingDown = useScrollingDown();
  const { theme, toggleTheme } = useTheme();

  // pathname
  const pathname = usePathname();

  // store
  const store = alertDialogStore();

  // Session and profile. A rejected profile (expired or blocked) clears the
  // tokens and redirects from inside the hook.
  const { payload, initial, username, isLoadingProfile } = useCurrentUser();

  return (
    <>
      {/*
        Slides out of view while scrolling down and returns on the way up.
        `sticky` keeps its slot in the flow, so hiding it never shifts content.
      */}
      <nav
        className={cn(
          "sticky top-0 z-50 border-b border-border bg-background/50 backdrop-blur-md transition-transform duration-300 ease-out",
          isScrollingDown && "-translate-y-full",
        )}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
              <MessageSquareText className="size-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Tellmi</span>
          </Link>

          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {payload ? (
              <>
                {/* Desktop-only links: on phones these live in the tab bar. */}
                <div className="hidden items-center gap-2 sm:flex">
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
                </div>

                {/* Desktop only: on phones this lives in the account menu. */}
                <ThemeToggle className="hidden sm:inline-flex" />

                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" className="gap-2 px-2" />}
                    className="cursor-pointer"
                  >
                    <Badge
                      variant={
                        payload.role === "ADMIN" ? "destructive" : "secondary"
                      }
                      className="hidden text-[10px] px-2.5 py-0 sm:inline-flex"
                    >
                      {payload.role}
                    </Badge>
                    <Avatar className="size-8">
                      {isLoadingProfile ? (
                        <Skeleton className="h-8 w-8 rounded-full" />
                      ) : (
                        <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                          {initial}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      {isLoadingProfile ? (
                        <Skeleton className="w-24 h-5" />
                      ) : (
                        <p className="text-sm font-medium">
                          {username || "Signed in"}
                        </p>
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

                    {/* Phone-only: the collapsed top bar has no room for these,
                        so the theme switch lives here instead of beside the
                        avatar. `sm:hidden` mirrors the standalone toggle above,
                        which is the desktop equivalent -- exactly one is ever
                        visible. */}
                    <DropdownMenuItem
                      onClick={toggleTheme}
                      className="cursor-pointer sm:hidden"
                    >
                      {theme === "dark" ? (
                        <Sun className="mr-2 size-4" />
                      ) : (
                        <Moon className="mr-2 size-4" />
                      )}
                      {theme === "dark" ? "Light theme" : "Dark theme"}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator className="sm:hidden" />

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
                <ThemeToggle />
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

      {/*
        A sibling of the navbar, not a child: the navbar's `backdrop-filter`
        would otherwise become the containing block for this fixed element and
        clip it to the navbar's box.
      */}
      <MobileTabBar payload={payload} isHidden={isScrollingDown} />
    </>
  );
};
