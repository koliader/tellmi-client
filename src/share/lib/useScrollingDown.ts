"use client";

import { useEffect, useRef, useState } from "react";

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
 */
export const useScrollingDown = (): boolean => {
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;

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
  }, []);

  return isScrollingDown;
};
