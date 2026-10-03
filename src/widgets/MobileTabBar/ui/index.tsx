"use client";

import { FC } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileTabBarProps {
  /** Slides the bar off-screen while the page is scrolled down. */
  isHidden: boolean;
}

/**
 * Fixed bottom navigation for phones.
 *
 * Rendered as a sibling of the top navbar, never inside it: the navbar uses
 * `backdrop-filter`, which makes it the containing block for any
 * `position: fixed` descendant, so nesting this bar would anchor it to the
 * navbar's box and clip it.
 */
export const MobileTabBar: FC<MobileTabBarProps> = ({ isHidden }) => {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const tabs = [
    { href: "/", label: "Home", icon: Home },

    { href: "/posts/create", label: "New", icon: Plus, primary: true },
    { href: "/posts", label: "Posts", icon: Tags },
  ];

  /*
   * The one place the phone has an active state worth acknowledging, since the
   * thumb covers the tab it is pressing. A touch has no hover to lean on, so
   * without this the only feedback a tap gets is the navigation that follows
   * it -- which is a whole route change away, and no feedback at all if the
   * link is the current page.
   */
  const pressable = "transition-[color,transform] duration-150 ease-out active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100";

  return (
    <nav
      aria-label="Primary"
      className={cn(
        /*
         * `pb-[env(safe-area-inset-bottom)]` is the part that matters and is easy
         * to miss. On a phone with a home indicator, `bottom-0` puts the bar
         * underneath it, so the bar's touch targets end up inside the region the
         * system reserves for the home gesture -- taps near the bottom do nothing,
         * or dismiss the bar instead of activating a tab. env() resolves to 0 on a
         * device with no inset, so nothing is reserved there.
         */
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/60 backdrop-blur-md pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-out sm:hidden",
        isHidden ? "translate-y-full" : "translate-y-0",
      )}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {tabs.map((tab) => {
          const active = isActive(tab.href);

          if (tab.primary) {
            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground",
                    pressable,
                  )}
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <tab.icon className="size-5" aria-hidden />
                  </span>
                  {tab.label}
                </Link>
              </li>
            );
          }

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium",
                  pressable,
                  active
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <tab.icon
                  className={cn("size-5", active && "text-foreground")}
                  aria-hidden
                />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
