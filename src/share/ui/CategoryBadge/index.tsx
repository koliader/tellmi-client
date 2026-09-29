import { CSSProperties, FC } from "react";
import { Badge } from "@/components/ui/badge";

interface CategoryBadgeProps {
  name: string;
  color: string;
}

/**
 * A Badge that renders a category as a tinted pill with a color dot.
 *
 * The raw colour is user-chosen, so it can be anything -- including `#000`,
 * which is invisible on the dark background. Rather than hardcoding a
 * substitute, the colour is handed to CSS as `--cat-color` and clamped into a
 * legible band per theme (see `.category-badge` in `app/globals.css`).
 * Anything that is not a parseable colour falls back to the muted token, so a
 * malformed value degrades to a neutral badge instead of an invisible one.
 */
export const CategoryBadge: FC<CategoryBadgeProps> = ({ name, color }) => (
  <Badge
    variant="outline"
    className="category-badge gap-1.5"
    style={{ "--cat-color": color } as CSSProperties}
  >
    <span aria-hidden className="category-badge-dot size-2 shrink-0 rounded-full" />
    {name}
  </Badge>
);
