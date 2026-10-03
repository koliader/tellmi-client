import { gatewayUrl } from "@/src/share/api";

/**
 * Where a member's avatar is served from, or null when they have none.
 *
 * The `updatedAt` suffix is what makes a replaced avatar appear immediately.
 * The API sets `Cache-Control: private, max-age=86400`, so a browser will reuse
 * a cached `/avatars/:id` response for a day and never revalidate it. Without a
 * changing URL, replacing your own avatar would leave your old picture on screen
 * for up to a day. The timestamp changes on every upload, so the URL changes with
 * it and the cache is bypassed exactly when it should be.
 *
 * The other half is the `ETag` the server sends: a client that already holds the
 * bytes for this exact timestamp revalidates and gets a 304, so a member whose
 * avatar has not changed costs one conditional request rather than a download.
 *
 * Returns null rather than a URL to a would-be-404 so callers render the
 * initials fallback without having to make a request that is known to fail.
 */
export const avatarUrl = (
  id: string,
  hasAvatar: boolean | undefined,
  updatedAt: number | undefined,
): string | null => {
  if (!hasAvatar || !updatedAt) {
    return null;
  }
  // Absolute, because the gateway serves this path and the app does not.
  return gatewayUrl(`/avatars/${id}?v=${updatedAt}`);
};
