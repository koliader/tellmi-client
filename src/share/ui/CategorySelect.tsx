"use client";

import { useMemo, useState } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ICategory } from "@/src/share/api/model/categories";
import { CategoryBadge } from "@/src/share/ui/CategoryBadge";

/**
 * A category picker that can be typed into.
 *
 * A plain list is fine at eight categories and unusable at forty: there is no
 * reading option past a screenful, and the control someone reaches for when they
 * know the name is to type it. The filter input is the whole point, and it is why
 * this exists instead of a wider Select.
 *
 * Filtering happens here rather than in the primitive because the list is already
 * in memory -- every category arrives with the page -- so the only job is narrowing
 * what is on screen.
 *
 * The reserved fallback is excluded rather than sorted to the bottom. It is not a
 * topic: it is where the system files a post whose category was deleted, so offering
 * it for writing into would produce posts that belong nowhere on purpose.
 * `includeFallback` exists for the one screen that does need to show it -- the admin
 * category list, where "what is in here" is the question.
 */
export const CategorySelect = ({
  categories,
  value,
  onChange,
  placeholder = "Filter by category",
  includeFallback = false,
  className,
  id,
}: {
  categories: ICategory[];
  /** The selected id, or 0 for no category filter. */
  value: number;
  onChange: (id: number) => void;
  placeholder?: string;
  includeFallback?: boolean;
  className?: string;
  id?: string;
}) => {
  const selectable = useMemo(
    () => categories.filter((c) => includeFallback || !c.isFallback),
    [categories, includeFallback],
  );

  // Typed text, held separately from the committed value: the input has to be free
  // to hold a query that matches nothing without that becoming the selection.
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return selectable;
    }
    return selectable.filter((c) => c.name.toLowerCase().includes(needle));
  }, [selectable, query]);

  const selected = selectable.find((c) => c.id === value) ?? null;

  return (
    // Wrapped rather than styled on the root: the root renders no element of its
    // own, so `className` on it is not a thing the type allows. The wrapper is also
    // what the positioner measures its width against.
    <div className={cn("relative", className)}>
      <Combobox.Root
        items={filtered}
        value={selected}
        onValueChange={(next: ICategory | null) => onChange(next?.id ?? 0)}
        onInputValueChange={(next: string) => setQuery(next)}
        // How an item is labelled in the input. Without it the primitive would show
        // "[object Object]" once a value is committed.
        itemToStringLabel={(item: ICategory) => item.name}
      >
        <div className="relative">
          <Combobox.Input
            id={id}
            aria-label="Category"
            className="h-9 w-full rounded-md border border-input bg-transparent py-2 pr-8 pl-2.5 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            placeholder={placeholder}
          />
          <Search
            className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        </div>

        <Combobox.Portal>
          <Combobox.Positioner className="z-50 mt-1 w-[var(--anchor-width)]">
            <Combobox.Popup className="max-h-64 overflow-y-auto rounded-md border bg-popover p-1 shadow-md">
              <Combobox.Empty className="px-2 py-4 text-center text-sm text-muted-foreground">
                No category matches that.
              </Combobox.Empty>

              <Combobox.List>
                {(item: ICategory) => (
                  <Combobox.Item
                    key={item.id}
                    value={item}
                    className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-selected:font-medium"
                  >
                    <CategoryBadge name={item.name} color={item.color} />
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  );
};
