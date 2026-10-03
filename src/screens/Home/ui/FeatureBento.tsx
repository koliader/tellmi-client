"use client";

import { FC } from "react";
import Link from "next/link";
import {
  ArrowRight,
  MessageCircle,
  MessagesSquare,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountUp } from "@/src/share/lib/useCountUp";

interface FeatureBentoProps {
  isSignedIn: boolean;
  username: string;
  /** Null until the figure has been read; 0 is a real, different answer. */
  totalPosts: number | null;
  commentsOnRecent: number | null;
  isLoading: boolean;
}

/** Renders 1234 as "1.2k" so a large count cannot stretch its cell. */
const compact = (value: number | null): string => {
  if (value === null) return "—";
  return value < 1000
    ? String(value)
    : `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
};

/**
 * A figure cell.
 *
 * The icon, the figure and the label live in one wrapper rather than as
 * siblings of the cell. With them as siblings, `justify-between` pushes the
 * icon to the top edge and the figure to the bottom, opening a gap in a cell
 * that only exists to hold three lines. Grouped, they stay together and the
 * card reads as a single block.
 *
 * On a phone the wrapper goes horizontal so the figure sits in line with the
 * icon instead of under it -- a stacked arrangement reads as a label with a
 * stray digit below it, and spends height a scrolling feed does not have.
 */
const statCell =
  "relative flex overflow-hidden rounded-3xl border bg-card p-5 text-card-foreground transition-colors sm:p-6";

const statBody =
  "flex flex-row items-center gap-4 md:flex-col md:items-start md:gap-3";

/**
 * A figure cell's contents, as one arriving block.
 *
 * The three lines settle together rather than the number fading in on its own:
 * split apart, the number would appear while "Posts / across all categories"
 * was already standing there, which makes the label look like a caption for a
 * value that has not arrived yet.
 */
const statArrival = "settle";

/**
 * A live figure.
 *
 * Two things are going on and both matter. The number counts up from zero as
 * it lands, because on this page the number is the payload -- a figure that is
 * simply present makes no claim about when it was read, and this page's whole
 * argument is that it was read a moment ago. And the digits are hidden from
 * assistive technology while they are moving, with the settled figure exposed
 * beside them, because a screen reader announcing "1, 2, 5, 9, 12" on a page
 * load would be reporting the animation rather than the board.
 */
const LiveFigure: FC<{ value: number | null; className: string }> = ({
  value,
  className,
}) => {
  const counted = useCountUp(value);
  const settled = compact(value);

  return (
    <>
      <p aria-hidden className={`${className} tabular-nums`}>
        {compact(counted)}
      </p>
      <span className="sr-only">{settled}</span>
    </>
  );
};

/**
 * The secondary CTA, which sits on the `bg-primary` hero.
 *
 * It has to force a transparent background. This project's `outline` variant is
 * not transparent -- it ships `bg-background` -- so on a light theme the hero is
 * near-black while the button is near-white, and the `text-primary-foreground`
 * used for the label is near-white too: white text on a white button. The
 * `dark:` background is overridden as well, since the variant sets
 * `dark:bg-input/30`, which is what made the two themes look accidentally
 * different rather than actually correct.
 */
const heroSecondaryCta =
  "cursor-pointer border-primary-foreground/35 bg-transparent text-primary-foreground shadow-none hover:bg-primary-foreground/10 hover:text-primary-foreground dark:border-primary-foreground/35 dark:bg-transparent dark:hover:bg-primary-foreground/10";

/**
 * The top of the landing page: a bento grid where every figure is read from the
 * live API.
 *
 * Deliberately token-driven rather than fixed hex colours -- `bg-primary`,
 * `bg-card`, `bg-muted` and `text-muted-foreground` all re-derive themselves
 * per theme, so the grid inverts correctly in dark mode without a second set of
 * styles. A fixed palette is the usual reason a layout like this only ever
 * looks right on a white background.
 */
export const FeatureBento: FC<FeatureBentoProps> = ({
  isSignedIn,
  username,
  totalPosts,
  commentsOnRecent,
  isLoading,
}) => (
  <section
    aria-labelledby="hero-title"
    className="grid grid-cols-1 gap-4 md:grid-cols-3 md:auto-rows-[14rem]"
  >
    {/* Hero — the only cell that carries the page's h1. `justify-end` anchors the
        whole block to the bottom, so the badge sits directly above the heading
        instead of being pinned away at the top of a mostly empty card. */}
    <div className="relative flex flex-col justify-end overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8 md:col-span-2 md:row-span-2">
      {/* A wash of the background token over the primary fill, so the gradient
          stays inside the theme instead of hardcoding a blue. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_90%_at_20%_0%,var(--background)_0%,transparent_60%)] opacity-[0.14]"
      />

      <div className="relative space-y-5">
        <p className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3.5 py-1.5 text-xs font-medium backdrop-blur-sm">
          <Radio className="size-3.5" aria-hidden />
          Live from the API
        </p>
        <h1
          id="hero-title"
          className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl"
        >
          {isSignedIn && username
            ? `Welcome back, ${username}`
            : "A place to post, then talk about it"}
        </h1>

        <p className="max-w-prose text-base leading-relaxed text-primary-foreground/80">
          Tellmi is a community discussion board. Write up something you worked
          on, then reply in the thread — no algorithm in the middle, just people
          reading what you wrote.
        </p>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row">
          {/*
            This cell is `bg-primary`, so the button's default `bg-primary`
            would be invisible against it. `bg-background` is the one token
            guaranteed to contrast with `bg-primary` in either theme.
          */}
          <Button
            size="lg"
            nativeButton={false}
            render={<Link href="/posts" />}
            className="cursor-pointer bg-background text-foreground hover:bg-background/90"
          >
            Browse posts
            <ArrowRight className="size-4" aria-hidden />
          </Button>

          {!isSignedIn && (
            <Button
              size="lg"
              variant="outline"
              nativeButton={false}
              render={<Link href="/auth/register" />}
              className={heroSecondaryCta}
            >
              Create an account
            </Button>
          )}
        </div>
      </div>
    </div>

    {/* Posts — the one figure that is a true site-wide total. */}
    <div className={statCell}>
      <div className={statBody}>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground">
          <MessagesSquare className="size-5" aria-hidden />
        </span>
        <div className={statArrival}>
          {isLoading ? (
            <Skeleton className="h-9 w-20" />
          ) : (
            <LiveFigure
              value={totalPosts}
              className="text-3xl font-bold md:text-4xl lg:text-5xl"
            />
          )}
          <p className="mt-0.5 font-medium md:mt-2">Posts</p>
          <p className="text-sm text-muted-foreground">across all categories</p>
        </div>
      </div>
    </div>

    {/* Comments — labelled as a sample, because the API has no total. */}
    <div className={statCell}>
      <div className={statBody}>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-foreground">
          <MessageCircle className="size-5" aria-hidden />
        </span>
        <div className={statArrival}>
          {isLoading ? (
            <Skeleton className="h-9 w-20" />
          ) : (
            <LiveFigure
              value={commentsOnRecent}
              className="text-3xl font-bold md:text-4xl lg:text-5xl"
            />
          )}
          <p className="mt-0.5 font-medium md:mt-2">Comments</p>
          <p className="text-sm text-muted-foreground">
            on the 50 newest posts
          </p>
        </div>
      </div>
    </div>

    {/* Join — spans the full width so the grid closes without a hole. */}
    <Link
      href={isSignedIn ? "/posts/create" : "/posts"}
      className="group relative flex flex-col justify-between gap-4 overflow-hidden rounded-3xl bg-muted p-6 text-foreground sm:flex-row sm:items-center sm:p-8 md:col-span-3 cursor-pointer"
    >
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {isSignedIn ? "Keep going" : "Join in"}
        </p>
        <h2 className="text-2xl font-bold leading-tight">
          {isSignedIn ? (
            <>Share what you&apos;re working on</>
          ) : (
            <>
              Reading is open
              <br className="hidden sm:inline" /> to everyone
            </>
          )}
        </h2>
        <p className="max-w-prose text-sm text-muted-foreground">
          {isSignedIn
            ? "Post a thought, or reply to someone else's. Both take the same click."
            : "Create an account to post and reply. Everything else stays public."}
        </p>
      </div>
      <span
        aria-hidden
        className="flex size-12 shrink-0 items-center justify-center self-start rounded-full bg-background text-xl sm:self-auto"
      >
        <ArrowRight className="-rotate-45 transition-transform duration-200 ease-out group-hover:rotate-0 motion-reduce:transition-none" />
      </span>
    </Link>
  </section>
);

export default FeatureBento;
