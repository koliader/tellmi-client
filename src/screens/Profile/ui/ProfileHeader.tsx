"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { avatarUrl } from "@/src/share/lib/avatar";
import { ShareButton } from "@/src/share/ui/ShareButton";

/** Relative join date, so a profile can say how long someone has been here. */
const joinedLabel = (createdAt: number | undefined) => {
  if (!createdAt) {
    return null;
  }
  const days = Math.floor((Date.now() - createdAt) / 86_400_000);
  if (days < 1) {
    return "Joined today";
  }
  if (days < 30) {
    return `Joined ${days} day${days === 1 ? "" : "s"} ago`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `Joined ${months} month${months === 1 ? "" : "s"} ago`;
  }
  const years = Math.floor(months / 12);
  return `Joined ${years} year${years === 1 ? "" : "s"} ago`;
};

export interface ProfileHeaderProps {
  username: string;
  bio?: string;
  createdAt?: number;
  avatar: string | null;
  /**
   * The path this profile is shareable at.
   *
   * Passed in rather than derived from the route because the two are different
   * URLs: your own profile lives at /profile and someone else's at /u/:id, and a
   * share button that always pointed at the current one would send your own
   * profile link to someone who cannot open it.
   */
  sharePath: string;
  /**
   * Rendered under the bio, on the right of the header row.
   *
   * Only on your own profile: a "you are viewing your own profile" link is
   * noise, and the edit form is one level away regardless.
   */
  aside?: React.ReactNode;
}

/**
 * The header of a profile, shared by your own and other members'.
 *
 * One component rather than two so the two cannot drift -- a bio that wraps on
 * someone else's page and not on yours, or an avatar at a different size
 * depending on which route produced it, is the kind of difference nobody
 * notices until it is shipped.
 */
export const ProfileHeader = ({
  username,
  bio,
  createdAt,
  avatar,
  sharePath,
  aside,
}: ProfileHeaderProps) => {
  const joined = joinedLabel(createdAt);
  const initial = username.trim().charAt(0).toUpperCase() || "?";

  return (
    <Card>
      <CardContent className="flex flex-wrap items-start gap-5">
        <Avatar className="size-20">
          {avatar ? <AvatarImage src={avatar} alt="" /> : null}
          <AvatarFallback className="bg-primary text-xl text-primary-foreground">
            {initial}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h1 className="truncate text-2xl font-semibold tracking-tight">
                {username}
              </h1>
              {joined ? (
                <p className="text-sm text-muted-foreground">{joined}</p>
              ) : null}
            </div>
            {/*
              Share is outside `aside` because `aside` is the own-profile-only slot
              holding the edit controls, and a share button mixed in with those
              reads as another thing that changes the profile. Sharing a profile
              is the one header action that is equally useful on yours and on
              someone else's, so it is not part of the owner-only cluster.
            */}
            <div className="flex items-center gap-1">
              <ShareButton path={sharePath} label="profile" />
              {aside}
            </div>
          </div>

          {/*
            whitespace-pre-wrap so a bio written with line breaks keeps them, and
            break-words so a long unbroken string cannot push the card wider than
            the page. Both are the member's own text rendered verbatim, which is
            the point of a bio.
          */}
          {bio ? (
            <p className="max-w-prose text-sm leading-relaxed whitespace-pre-wrap break-words">
              {bio}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

/** Convenience for the two call sites, which each hold a member object. */
export const avatarFor = (
  id: string,
  hasAvatar: boolean | undefined,
  updatedAt: number | undefined,
) => avatarUrl(id, hasAvatar, updatedAt);
