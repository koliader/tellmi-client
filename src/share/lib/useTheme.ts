"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  THEME_STORAGE_KEY,
  TTheme,
  applyTheme,
  getThemeServerSnapshot,
  getThemeSnapshot,
  storeTheme,
  subscribeTheme,
} from "@/src/share/lib/theme";

interface IUseTheme {
  theme: TTheme;
  toggleTheme: () => void;
  setTheme: (theme: TTheme) => void;
}

/**
 * Reads and updates the colour theme.
 *
 * The theme is external state (a class on `<html>`, localStorage and the OS
 * media query), so it is read through `useSyncExternalStore` rather than
 * copied into state from an effect. The pre-paint script in the root layout has
 * already applied the class, so there is no flash of the wrong theme and no
 * hydration mismatch.
 */
export const useTheme = (): IUseTheme => {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );

  const setTheme = useCallback((next: TTheme) => {
    applyTheme(next);
    // storeTheme notifies subscribers, which re-renders with the new value.
    storeTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  return { theme, toggleTheme, setTheme };
};

/** Re-exported so callers do not need a second import for the key. */
export { THEME_STORAGE_KEY };
