"use client";

import { FC, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface LoadMoreSentinelProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}

/**
 * End-of-list marker for infinite scroll. An IntersectionObserver watches this
 * element and asks for the next batch once it comes into view, which also
 * covers the case where the list is short enough that it is visible on load.
 */
export const LoadMoreSentinel: FC<LoadMoreSentinelProps> = ({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !hasNextPage || isFetchingNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      // Start fetching slightly before the marker reaches the viewport so the
      // next batch is usually already there by the time it is needed.
      { rootMargin: "200px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  if (!hasNextPage) {
    return null;
  }

  return (
    <div
      ref={ref}
      className="flex items-center justify-center py-4"
      role="status"
      aria-live="polite"
    >
      {isFetchingNextPage ? (
        <>
          <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
          <span className="sr-only">Loading more posts</span>
        </>
      ) : null}
    </div>
  );
};
