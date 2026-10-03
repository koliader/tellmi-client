"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * How long a figure takes to arrive. Long enough that the eye reads a change
 * rather than a value, short enough that it never becomes something to wait
 * for -- a counter that takes a second reads as slow software.
 */
const DURATION = 700;

/**
 * Ease-out quadratic.
 *
 * Deliberately gentler than the `--motion-decel` curve the CSS entrances use.
 * That curve is so front-loaded that a number moving along it would be at half
 * its final value within the first frame or two, which looks like a jump cut
 * with extra steps. This one leaves zero slowly, so the figure appears to be
 * measured rather than dropped in.
 */
const ease = (progress: number): number => progress * (2 - progress);

/**
 * A number that counts up to its target instead of appearing at it.
 *
 * This is the motion thesis of the home page, and it is worth being precise
 * about why. The page reports the live state of a board: the width of a bar is
 * a post count, the headline figure is a post count. A figure that visibly
 * arrives says that number was just read from the API a moment ago, which is
 * the one claim the page is actually making. A figure that is simply present
 * makes no claim at all -- it could have been written into the markup hours ago,
 * and on a page that talks about itself being live, that difference matters.
 *
 * Three properties keep it honest:
 *
 * 1. It never shows a number the API did not send. `null` is passed straight
 *    through, because null is this codebase's "not known" and the caller
 *    renders a dash for it.
 * 2. It runs on every change, not only the first. A background refetch that
 *    moves a figure from 12 to 13 ticks the one digit, which is the cheapest
 *    possible report that something happened on the board.
 * 3. It obeys the motion preference. Asked for less motion, the figure is its
 *    final value from the render that produces it -- there is no frame loop to
 *    cancel and no intermediate value to flash past.
 */
export const useCountUp = (
  target: number | null,
  duration: number = DURATION,
): number | null => {
  const prefersReducedMotion = usePrefersReducedMotion();

  const [shown, setShown] = useState(0);

  // Where the last run left off, so a retarget mid-flight continues from the
  // number actually on screen rather than restarting from the old target.
  const from = useRef(0);
  const frame = useRef<number | null>(null);

  /*
   * Resolved during render rather than in the effect below. A visitor who has
   * asked for reduced motion must never see an intermediate value, and the
   * only way to guarantee that is to answer before the frame loop can start --
   * setting state in the effect body would paint the starting value first and
   * the correct one a commit later, which is a blink.
   *
   * The returns come after the effect rather than before it: a hook that is
   * called conditionally would change the hook order for the renders that take
   * the early exit, and both of those are ordinary renders here.
   */
  useEffect(() => {
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }

    if (target === null) {
      return;
    }

    // Nothing to travel. Landing on the value beats burning seventeen frames
    // to arrive at the number that is already there.
    if (target === from.current) {
      return;
    }

    /*
     * The preference is re-checked here because a store-backed value is one
     * commit behind on a hydration pass. Reading it again closes the gap: if it
     * has switched on since the render above, no loop starts, and the ref is
     * moved so that turning it back off continues from the right number instead
     * of counting up from zero a second time.
     */
    if (prefersReducedMotion) {
      from.current = target;
      return;
    }

    const start = from.current;
    let beganAt: number | null = null;

    const step = (now: number) => {
      if (beganAt === null) {
        beganAt = now;
      }

      const progress = Math.min((now - beganAt) / duration, 1);
      const next = Math.round(start + (target - start) * ease(progress));
      from.current = next;
      setShown(next);

      if (progress < 1) {
        frame.current = requestAnimationFrame(step);
      } else {
        frame.current = null;
      }
    };

    frame.current = requestAnimationFrame(step);

    return () => {
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
    };
  }, [target, duration, prefersReducedMotion]);

  // Unknown stays unknown: null is this codebase's "not known", and the caller
  // renders a dash for it. Never a zero, which would be a claim.
  if (target === null) {
    return null;
  }

  if (prefersReducedMotion || duration <= 0) {
    return target;
  }

  return shown;
};
