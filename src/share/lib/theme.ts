export type TTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "tellmi-theme";

/**
 * Inline script injected before first paint so the theme class is already on
 * `<html>` when the app renders. Without this the page would flash light
 * before the client-side effect runs.
 *
 * Kept as a string because it is inlined verbatim in the document head.
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var k=${JSON.stringify(THEME_STORAGE_KEY)};
var s=localStorage.getItem(k);
var t=(s==="light"||s==="dark")?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
var c=document.documentElement.classList;
if(t==="dark"){c.add("dark")}else{c.remove("dark")}
c.add("theme-"+t);
}catch(e){}})();`;

/** Reads the stored preference, or null when the user has not chosen one. */
export const readStoredTheme = (): TTheme | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    // Private browsing or blocked storage: fall back to the system setting.
    return null;
  }
};

/** The theme to use when nothing is stored: follow the OS preference. */
export const getSystemTheme = (): TTheme => {
  if (typeof window === "undefined") {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export const resolveTheme = (): TTheme => readStoredTheme() ?? getSystemTheme();

/** Applies the theme by toggling the `dark` class and the `theme-*` marker. */
export const applyTheme = (theme: TTheme) => {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.remove("theme-light", "theme-dark");
  root.classList.add(`theme-${theme}`);
  root.style.colorScheme = theme;
};

export const storeTheme = (theme: TTheme) => {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Preference simply will not persist; the session still works.
  }
  // Keep the snapshot cache in step, otherwise useSyncExternalStore re-reads
  // the stale value, sees no change and never re-renders.
  cachedTheme = theme;
  emit();
};

/* ---------------------------------------------------------------------------
 * External store
 *
 * The theme lives outside React (DOM class, localStorage, media query), so it
 * is exposed through useSyncExternalStore rather than mirrored into state with
 * an effect. That also yields the correct server snapshot during hydration
 * instead of a client-only state read that would mismatch.
 * ------------------------------------------------------------------------- */

const listeners = new Set<() => void>();

const emit = () => {
  for (const listener of listeners) {
    listener();
  }
};

let cachedTheme: TTheme | null = null;

const readTheme = (): TTheme => {
  // Cached because useSyncExternalStore may call this repeatedly per render.
  if (cachedTheme === null) {
    cachedTheme = resolveTheme();
  }
  return cachedTheme;
};

const systemMedia = () =>
  typeof window === "undefined"
    ? null
    : window.matchMedia("(prefers-color-scheme: dark)");

/** Notifies subscribers when the OS preference changes. */
const onSystemChange = () => {
  // An explicit choice wins; only follow the OS when there is none.
  if (readStoredTheme()) {
    return;
  }
  cachedTheme = getSystemTheme();
  applyTheme(cachedTheme);
  emit();
};

export const subscribeTheme = (onStoreChange: () => void) => {
  if (listeners.size === 0) {
    systemMedia()?.addEventListener("change", onSystemChange);
  }
  listeners.add(onStoreChange);

  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0) {
      systemMedia()?.removeEventListener("change", onSystemChange);
    }
  };
};

export const getThemeSnapshot = (): TTheme => readTheme();

/** The pre-paint script already set the class, so this only affects SSR text. */
export const getThemeServerSnapshot = (): TTheme => "light";

/** Drops the cached value, so the next read re-resolves from storage. */
export const resetThemeCache = () => {
  cachedTheme = null;
};
