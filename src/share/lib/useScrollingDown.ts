"use client";

import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/** Movement needed before the direction flips, so tiny jitters are ignored. */
const THRESHOLD = 8;

/** Distance from the top within which the bars are always shown. */
const ALWAYS_SHOW = 64;

/**
 * Reports whether the page is being scrolled down, so the navigation bars can
 * slide out of the way and come back on the way up.
 *
 * Always false near the top of the page: hiding the only way back to the
 * navigation would be a trap.
 *
 * Always false for a visitor who has asked for reduced motion, and that is the
 * whole of their alternative rather than a shorter version of the same slide.
 * The bar travels in response to the visitor's own scrolling, which is the one
 * motion here that is not opt-in by the act of scrolling; there is nothing
 * meaningful to speed up, and a bar that flickered in and out on every scroll
 * event would be worse to live with than one that stayed put. Keeping the
 * navigation on screen is also strictly more useful -- it is the only route
 * back to the rest of the app.
 */
export const useScrollingDown = (): boolean => {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;

    /*
     * No listener at all for a visitor who has asked for reduced motion, rather
     * than a listener that resolves false. There is nothing for it to do: the
     * bars must stay put, and subscribing would only produce work whose every
     * outcome is "leave it alone".
     */
    if (prefersReducedMotion) {
      return;
    }

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;

      if (y < ALWAYS_SHOW) {
        setIsScrollingDown(false);
        lastY.current = y;
        return;
      }

      if (Math.abs(delta) < THRESHOLD) {
        return;
      }

      setIsScrollingDown(delta > 0);
      lastY.current = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [prefersReducedMotion]);

  /*
   * Answered here rather than by resetting the state in the effect, so that
   * switching the preference on while scrolled mid-page puts the bars back
   * immediately -- the state may still hold a true from before, and the only
   * thing that has to be true is what this hook reports.
   */
  return prefersReducedMotion ? false : isScrollingDown;
};
