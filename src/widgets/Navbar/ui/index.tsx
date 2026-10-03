"use client";


import Link from "next/link";
import {
  LogOut,
  MessageSquareText,
  Moon,
  Plus,
  ShieldCheck,
  Sun,
  UserPen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
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
import { useFrostArmed } from "@/src/share/lib/useFrostArmed";
import { cn } from "@/lib/utils";

/**
 * The graduated frost under the top bar: five backdrop-filter layers, each
 * blurring harder than the one above it while its mask fades out sooner.
 *
 * Blur radius climbs 0.25px to 4.5px as the opaque part of the mask drops from
 * 90% to 5%, so the effect is strongest directly under the bar and gone by the
 * time it reaches 8rem. Stacking the two properties this way -- rather than one
 * heavily masked blur -- is what produces a smooth falloff instead of a band
 * with a visible edge.
 *
 * The radii are larger than the effect looks, and the top layer is the small one
 * on purpose. Composing Gaussian blurs adds variances, not radii: blurring an
 * already-blurred backdrop by b widens it by sqrt(v + b^2). Five layers at
 * 0.25/1/2.25/3.5/4.5px therefore reach 6.2px of effective blur at the top of the
 * band -- and note that is a quarter of the radii, but half the blur, because
 * variance is quadratic. Every radius here was halved together to take the
 * frosting down, and the whole ramp came out at 0.5x: a change that looks like a
 * small edit here is a halving of what the eye actually sees.
 *
 * These were 0.5/2/4.5/7/9px, which read as heavy frosted glass over the
 * headline rather than a top edge. Note that the `nav` below carries its own flat
 * `backdrop-blur-md` at a uniform 12px, which is larger than any single layer
 * here and covers the top 57px of the band -- so it, not this ramp, is what sets
 * how blurred the top of the bar actually looks while both are present.
 *
 * Kept as data so the order and the pairing of radius to mask are readable, and
 * so a layer can be dropped without touching the markup. Each layer is a
 * separate blur of the backdrop on every frame across the full band width, so the
 * count is the first thing to trim if scrolling ever feels heavy -- dropping the
 * smallest is close to invisible, dropping the largest is not.
 */
const BLUR_LAYERS = [
  { blur: "0.25px", mask: "linear-gradient(to bottom, black 0%, black 90%, transparent 100%)" },
  { blur: "1px", mask: "linear-gradient(to bottom, black 0%, black 75%, transparent 100%)" },
  { blur: "2.25px", mask: "linear-gradient(to bottom, black 0%, black 50%, transparent 88%)" },
  { blur: "3.5px", mask: "linear-gradient(to bottom, black 0%, black 24%, transparent 60%)" },
  { blur: "4.5px", mask: "linear-gradient(to bottom, black 0%, black 5%, transparent 34%)" },
] as const;

export const Navbar = () => {
  // Hides the bars on the way down, brings them back on the way up.
  const isScrollingDown = useScrollingDown();

  // Whether the graduated blur is drawn. Off while the page is at the top, on
  // once content is travelling under the bar, and withdrawn again on the way
  // back -- after a hold, not as a fade. See the hook for the deadband that keeps
  // it from strobing and for why the hold is not something a motion preference
  // has to override.
  const isFrostArmed = useFrostArmed();

  const { theme, toggleTheme } = useTheme();

  // pathname
  const pathname = usePathname();

  // store
  const store = alertDialogStore();

  // Session and profile. A rejected profile (expired or blocked) clears the
  // tokens and redirects from inside the hook.
  const { payload, initial, username, isLoadingProfile, avatarUrl } =
    useCurrentUser();

  return (
    <>
      {/*
        Slides out of view while scrolling down and returns on the way up.
        `sticky` keeps its slot in the flow, so hiding it never shifts content.

        The transform lives on this wrapper rather than on the `nav` so the
        graduated blur slides away with the bar. Translating the `nav` alone
        would leave the blur band pinned to the top of the viewport with no
        content inside it.
      */}
      <header
        className={cn(
          "sticky top-0 z-50 transition-transform duration-300 ease-out",
          isScrollingDown && "-translate-y-full",
        )}
      >
        {/*
          Five stacked backdrop-filter layers, each blurring harder than the one
          above it and masked to fade out sooner. Blur radius climbs 0.25px to
          4.5px while the opaque part of the mask drops from 90% to 5%, so the
          frosting is strongest under the bar and gone by 8rem (h-32). The radii
          overshoot what the eye reads because the blurs compose by adding
          variances rather than radii -- see the note on BLUR_LAYERS above.

          They sit at -z-10 *within this header's own stacking context* (sticky
          plus z-50 creates one), which keeps them above the page background
          while the `nav` paints on top. A negative z-index measured against the
          root instead would put them behind `body` and make them invisible.

          Mounted only while the page is scrolled. At the top the hero sits under
          the bar already fully painted and nothing is travelling beneath it, so
          five backdrop filters would be frosting a static edge -- cost with no
          image to soften.

          Unmounted rather than hidden behind `opacity-0`, which is the whole
          reason the withdrawal is a hold instead of a transition. A layer left
          attached and transparent is still painted, so its five backdrop filters
          would keep running every frame over a hero that is not moving. That is
          the exact cost this arrangement exists to avoid, and an element that has
          been unmounted has no opacity left to fade: the bar is frosted, then it
          is not, and the wait in between belongs to the hook.
        */}
        {isFrostArmed && (
          <div
            aria-hidden
            data-slot="blur-layers"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32"
          >
            {BLUR_LAYERS.map(({ blur, mask }) => (
              <div
                key={blur}
                className="absolute inset-0"
                style={{
                  backdropFilter: `blur(${blur})`,
                  WebkitBackdropFilter: `blur(${blur})`,
                  maskImage: mask,
                  WebkitMaskImage: mask,
                }}
              />
            ))}
          </div>
        )}

        <nav
          data-frost
          className="relative z-10 border-b border-border bg-background/50 backdrop-blur-md"
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
                        <>
                          {/*
                            avatarUrl is null when no picture is set, which is a
                            settled answer rather than a pending one -- so the
                            fallback renders straight away instead of waiting to
                            find out.
                          */}
                          {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
                          <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                            {initial}
                          </AvatarFallback>
                        </>
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

                    <DropdownMenuItem
                      className="cursor-pointer"
                      render={<Link href="/profile" />}
                    >
                      <UserPen className="mr-2 size-4" />
                      Profile
                    </DropdownMenuItem>

                    {payload.role === "ADMIN" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="cursor-pointer"
                          render={<Link href="/admin" />}
                        >
                          <ShieldCheck className="mr-2 size-4" />
                          Admin panel
                        </DropdownMenuItem>
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
      </header>

      {/*
        A sibling of the navbar, not a child: the navbar's `backdrop-filter`
        would otherwise become the containing block for this fixed element and
        clip it to the navbar's box.
      */}
      <MobileTabBar isHidden={isScrollingDown} />
    </>
  );
};
