"use client";

/**
 * The first Tab stop on every page: a link that jumps past the navigation.
 *
 * The navigation is eight links and a theme toggle, and on a keyboard it is
 * re-entered on every page. Someone using a keyboard to read a post spends more
 * keystrokes getting to the text than reading it.
 *
 * Hidden until focused rather than permanently hidden. `sr-only` keeps it
 * available to a screen reader and to the Tab order while removing it visually;
 * focus reveals it. A link that is `display: none` or `visibility: hidden` is
 * removed from the tab order entirely and stops being a skip link at all.
 *
 * The target is `#main-content`, which the layout gives `tabIndex={-1}` so it can
 * receive focus -- focusing a non-interactive element is ignored otherwise, and
 * the next Tab would drop the reader back into the navigation.
 */
export const SkipToContent = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
  >
    Skip to content
  </a>
);
