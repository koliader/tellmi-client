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

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/60 backdrop-blur-md transition-transform duration-300 ease-out sm:hidden",
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
                  className="flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-muted-foreground"
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
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
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
