"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { avatarUrl } from "@/src/share/lib/avatar";

/**
 * The one place an author's picture is rendered.
 *
 * Every site that shows a member -- the navbar, a post card, a post page, a
 * comment, the contributor lists -- uses this, so they cannot disagree about
 * when to show a picture versus an initial. That disagreement is not cosmetic:
 * the fallback and the image are different elements, and a call site that
 * forgets the image shows an initial next to a row that elsewhere in the same
 * page is showing a face.
 *
 * `alt` is empty by default. These are decorative next to a name that is always
 * rendered beside them, so naming the picture again would make a screen reader
 * read "photo of Alice, Alice". A call site with no visible name passes one.
 */
export const UserAvatar = ({
  id,
  username,
  hasAvatar,
  avatarUpdatedAt,
  className,
  fallbackClassName,
  alt = "",
}: {
  id: string;
  username: string;
  hasAvatar?: boolean;
  avatarUpdatedAt?: number;
  className?: string;
  fallbackClassName?: string;
  alt?: string;
}) => {
  const src = avatarUrl(id, hasAvatar, avatarUpdatedAt);
  const initial = username?.trim().charAt(0).toUpperCase() || "?";

  return (
    <Avatar className={className}>
      {/*
        Only mounted when there is a picture to fetch. avatarUrl returns null for
        a member without one, which is a settled answer rather than a pending
        one, so the initial renders straight away instead of after a request that
        is known to 204.
      */}
      {src ? <AvatarImage src={src} alt={alt} /> : null}
      <AvatarFallback className={fallbackClassName}>{initial}</AvatarFallback>
    </Avatar>
  );
};
