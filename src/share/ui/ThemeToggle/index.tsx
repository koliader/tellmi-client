"use client";

import { FC } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/src/share/lib/useTheme";

interface ThemeToggleProps {
  className?: string;
}

/**
 * Switches between the light and dark themes. The icon is rendered only after
 * mount, because the resolved theme is unknown during the server render.
 */
export const ThemeToggle: FC<ThemeToggleProps> = ({ className }) => {
  const { theme, toggleTheme } = useTheme();

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      className={`cursor-pointer ${className ?? ""}`}
      aria-label={label}
      title={label}
    >
      {/* Both icons are always mounted and cross-faded, so the button keeps a
          stable size while the theme changes. */}
      <Sun
        className={`size-4 transition-all ${isDark ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
        aria-hidden
      />
      <Moon
        className={`absolute size-4 transition-all ${isDark ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
        aria-hidden
      />
    </Button>
  );
};
