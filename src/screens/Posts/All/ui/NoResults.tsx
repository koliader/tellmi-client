"use client";

import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/src/share/ui/CategoryBadge";

/**
 * What to show when a search returns nothing.
 *
 * "No posts match your filters" tells someone they have already worked out that
 * nothing matched, and stops there. It does not say what was searched, so a
 * misspelt name looks identical to an empty board, and it offers no way forward
 * except finding the filter bar again and clearing each thing by hand.
 *
 * So it names the term, says which field it was matched against, and offers the
 * one action that is likely to help. Deliberately not a list of suggestions: with
 * no index of what does exist, any "did you mean" would be a guess, and a wrong
 * suggestion is worse than none.
 */
export const NoResults = ({
  search,
  categoryId,
  categoryName,
  onClearSearch,
  onClearCategory,
}: {
  search: string;
  categoryId: number;
  categoryName?: string;
  onClearSearch: () => void;
  onClearCategory: () => void;
}) => {
  // Nothing was filtered at all, so there is genuinely no post on the board yet.
  if (search === "" && categoryId === 0) {
    return (
      <div className="settle rounded-lg border border-dashed p-12 text-center">
        <p className="text-sm text-muted-foreground">
          No posts yet. Be the first to write one.
        </p>
      </div>
    );
  }

  const term = search.trim();

  return (
    <div className="settle flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
      <SearchX className="size-6 text-muted-foreground" aria-hidden />

      {term ? (
        <>
          <p className="text-sm">
            Nothing matches{" "}
            <span className="font-medium">“{term}”</span>.
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Searched post titles and author names, so a spelling that does not
            match either will find nothing.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm">Nothing in this category yet.</p>
          {categoryName ? (
            <CategoryBadge name={categoryName} color="" />
          ) : null}
        </>
      )}

      {/* Only the filter that is actually applied, so there is one way forward. */}
      <Button
        variant="outline"
        size="sm"
        onClick={term ? onClearSearch : onClearCategory}
      >
        {term ? "Clear search" : "Show all categories"}
      </Button>
    </div>
  );
};
