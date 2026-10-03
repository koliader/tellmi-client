"use client";

import { useEffect, useState } from "react";

/**
 * Scroll distance above which the frost is drawn, and the distance below which
 * it is withdrawn.
 *
 * The two are deliberately different. A single threshold means the effect
 * toggles on the exact pixel where the condition flips, so parking the page at
 * that offset -- which momentum and rubber-band overscroll both do on the way
 * back to the top -- makes it strobe. A 4px deadband removes the boundary
 * entirely, and both edges sit within the first few pixels of the page where the
 * effect is meant to be off anyway.
 */
const ARM_ABOVE = 8;
const DISARM_BELOW = 4;

/**
 * Whether the graduated blur under the navigation bar should be drawn.
 *
 * The frost exists to soften the page content sliding underneath the bar. At the
 * very top of the page there is no such content: the hero is already fully
 * painted and nothing is travelling under the bar yet, so the effect is doing
 * real work for nothing and blurring a static edge for no gain. So the effect
 * tracks the scroll position and withdraws again on the way back up.
 *
 * It is compared against the position rather than latched on the first scroll.
 * Latching is defensible -- it avoids the bar losing its frosting during the one
 * gesture where the bar most needs to stay legible -- but it also means a visitor
 * who scrolls once and then reads the top of the page for a while is left looking
 * at a blurred band over a hero that is not moving. The bar is `sticky`, so the
 * top of the page is a place people stay; frost that outlives the motion that
 * justified it is just a smudge over the headline.
 *
 * Both directions are immediate, and neither is animated. A hold was tried here
 * -- 300ms of grace after reaching the top, so that momentum overshoot and a
 * trackpad's settle would be absorbed rather than making the frost vanish and
 * snap back a frame later. It did absorb them, and it read as sluggish: the bar
 * was still frosted for a third of a second after the page had demonstrably
 * stopped at the top, which is exactly the smudge the withdrawal exists to
 * remove. The bounce it was protecting against is a few frames of flicker near
 * the very top of a page, which is a better trade than a visible lag on every
 * single arrival. The deadband above is what remains of the protection, and it
 * costs nothing perceptible because it only covers the first four pixels.
 *
 * There is no animation on the withdrawal and no branch for reduced motion, and
 * the two are the same decision. An earlier version cross-faded the layers out
 * over 300ms. A cross-fade is movement, so it needed suppressing for anyone who
 * had asked for less motion -- and it needed the wrapper to stay mounted so the
 * transition had a previous opacity to travel from, which in turn meant a hold
 * had to be timed to outlive the fade. Removing the animation collapses all of
 * that. What remains is a discrete on/off, and a discrete change is not something
 * a motion preference has any bearing on: the visitor sees the bar already
 * frosted and then simply not frosted, having watched nothing move. So the layers
 * unmount outright, an invisible element is never left behind paying for five
 * backdrop filters over a static hero, and there is no second timeline to keep in
 * step with the first.
 *
 * Because the answer is reversible, the listener cannot be torn down once the
 * effect is on -- it has to keep watching in case the visitor returns to the top.
 * That is one passive listener reading a number already in memory per scroll
 * event, and it sets state only when the answer actually changes, so the cost is
 * not proportional to scrolling.
 */
export const useFrostArmed = (): boolean => {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const apply = (y: number) => {
      // Functional form so the update is decided from the current value rather
      // than a closure captured when the listener was attached, and so React
      // bails out of the re-render when the answer has not actually moved. The
      // deadband is where most scroll events land, so the common case is a
      // no-op.
      setArmed((current) => {
        if (y > ARM_ABOVE) {
          return true;
        }
        if (y < DISARM_BELOW) {
          return false;
        }
        return current;
      });
    };

    /*
     * A page restored mid-scroll -- a refresh, a back/forward navigation, a
     * fragment link -- is already scrolled when this mounts, and the visitor may
     * never scroll again. Reading the position only on the next event would leave
     * the bar un-frosted over content that is genuinely moving underneath it.
     *
     * Read on the first frame rather than in the effect body: a synchronous
     * setState here would be a render-blocking state update during the effect
     * phase, which is exactly the `react-hooks/set-state-in-effect` pattern. One
     * frame is also the first point at which layout, and therefore a meaningful
     * scrollY, exists.
     */
    const frame = requestAnimationFrame(() => apply(window.scrollY));

    const onScroll = () => apply(window.scrollY);

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return armed;
};
