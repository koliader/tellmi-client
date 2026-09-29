/**
 * Formats a Unix epoch millisecond timestamp as a short relative time,
 * e.g. "just now", "5m ago", "3h ago", "2d ago", then an absolute date once
 * it is older than a week.
 */
export function formatRelativeTime(epochMs: number | undefined): string {
  if (!epochMs) {
    return "";
  }

  const diffMs = Date.now() - epochMs;

  // Clock skew or a timestamp in the future: treat it as "just now" rather
  // than rendering a negative age.
  if (diffMs < 0) {
    return "just now";
  }

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return new Date(epochMs).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
