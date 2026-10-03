"use client";

import { useSyncExternalStore } from "react";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Reads the preference right now, with no React state involved.
 *
 * Effects that animate on mount need the answer on their first pass. Reading it
 * through a subscription instead means the first effect run sees the value the
 * hook had during that render, which is the server's `false` on a hydration
 * pass -- so a visitor who asked for no motion would still get one animation
 * before React caught up. This is the honest version of the same question, and
 * it is only ever called from effects, where there is nothing to desync.
 */
export const prefersReducedMotionNow = (): boolean => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
};

/** Subscribes to the preference, so components can branch while rendering. */
const subscribe = (onChange: () => void): (() => void) => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }

  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  // `addEventListener` is the modern form; `addListener` is the only one
  // available on the older WebKit that Safari shipped before 14.
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }
  query.addListener(onChange);
  return () => query.removeListener(onChange);
};

/** False during SSR and for the hydration pass, so the markup matches. */
const getServerSnapshot = (): boolean => false;

/**
 * Live value of `prefers-reduced-motion: reduce`, for render-time branches.
 *
 * This is for decisions that change what gets rendered -- hiding a slide
 * entirely, or resolving an animated value to its final one. Anything that can
 * be expressed as a `@media` rule belongs in CSS instead, because CSS is what
 * decides it before the first paint rather than a commit later.
 */
export const usePrefersReducedMotion = (): boolean =>
  useSyncExternalStore(subscribe, prefersReducedMotionNow, getServerSnapshot);
