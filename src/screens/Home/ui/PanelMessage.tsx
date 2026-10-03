"use client";

import { FC, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PanelMessageProps {
  children: ReactNode;
  /**
   * The way out of this state, when there is one. An empty list with no route
   * forward is a dead end, so a panel that can be fixed by the visitor says how.
   */
  action?: { label: string; href: string };
  /**
   * `empty` is a fact about the board and gets the dashed frame the rest of the
   * app uses for that. `unavailable` is a fact about the request, already
   * explained by the banner at the top of the page, so it stays frameless and
   * does not compete with it.
   */
  tone?: "empty" | "unavailable";
}

/**
 * The way a panel says it has nothing, or that it could not find out.
 *
 * `settle` is the same arrival the data panels use, for the same reason: this
 * box replaces a skeleton, and an empty state that appears by subtraction reads
 * as a panel that failed to render rather than a board with nothing on it yet.
 */
export const PanelMessage: FC<PanelMessageProps> = ({
  children,
  action,
  tone = "empty",
}) => (
  <div
    className={cn(
      "settle rounded-xl px-4 py-8 text-center text-sm text-muted-foreground",
      tone === "empty" && "border border-dashed",
    )}
  >
    <p className="mx-auto max-w-[46ch] text-pretty">{children}</p>

    {action ? (
      <Link
        href={action.href}
        className="mt-3 inline-flex rounded-sm font-medium text-foreground underline underline-offset-4 transition-colors hover:text-foreground/70 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {action.label}
      </Link>
    ) : null}
  </div>
);

export default PanelMessage;
