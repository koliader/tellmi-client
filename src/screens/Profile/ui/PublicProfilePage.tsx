"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UsersApiService } from "@/src/share/api/UsersApiService";
import { IQueryError } from "@/src/share/api/model/api";
import { IPublicProfile } from "@/src/share/api/model/users";
import { useCurrentUser } from "@/src/share/api/useCurrentUser";
import { ProfileActivity } from "./ProfileActivity";
import { ProfileHeader, avatarFor } from "./ProfileHeader";

/**
 * Someone else's profile.
 *
 * Deliberately a different component from your own, which edits. Two reasons:
 * your page is a form and this is a read, and merging them would put edit state,
 * dirty tracking and a save button into a page nobody can edit. The header and
 * the two activity tabs are shared instead, so the parts that must look the same
 * do.
 *
 * A "this is you" link is shown when the id being viewed is the signed-in
 * member's, because a profile is reachable from anywhere -- a post author name,
 * a comment -- and the only route to editing from there is the account menu.
 */
export const PublicProfilePage = () => {
  // Read from the route rather than a prop, so the page has one way to be
  // mounted. The segment is [id], so the profile's identity is the URL and
  // nothing else.
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { payload } = useCurrentUser();
  const api = useMemo(() => new UsersApiService(), []);

  const query = useQuery<IPublicProfile, AxiosError<IQueryError>>({
    queryKey: ["publicProfile", id],
    queryFn: () => api.getPublicProfile(id!),
    enabled: Boolean(id),
    // A profile is a page someone links to and comes back to, not one they
    // watch. Cached for a minute so navigating back from a post does not refetch
    // what was just read.
    staleTime: 60_000,
    /*
     * One retry, matching the rest of the app. The default is three, which on a
     * member who does not exist means three 404s spread over several seconds
     * behind a skeleton -- the page looks like it is still loading something
     * that is never going to arrive. One covers a dropped connection, which is
     * the failure worth waiting out.
     */
    retry: 1,
  });

  const isMe = Boolean(payload && id && payload.id === id);

  /*
   * `isLoading` rather than `isPending`: isPending is true on every load with no
   * data, including the ones that are being retried, so it would keep the
   * skeleton up through a failure. isLoading is false once a settled error has
   * arrived, which is what lets the branch below be reached.
   */
  if (query.isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-10 w-56 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const apiError = (query.error?.response?.data as IQueryError | undefined)
    ?.error;

  if (query.isError || !query.data) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile unavailable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p
              role="alert"
              className="flex items-center gap-2 text-sm text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" />
              {/*
                The API's own message where there is one -- "user not found"
                reads better than axios's "Request failed with status code 404",
                which names a status rather than what went wrong. Falls back to
                the axios text only if the body carried no error field, so a
                failure that never reached the API still says something.
              */}
              {apiError ??
                query.error?.message ??
                "This profile could not be loaded."}
            </p>
            <p className="text-sm text-muted-foreground">
              The member may have been removed, or the link may be wrong.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profile = query.data;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
      <ProfileHeader
        username={profile.username}
        bio={profile.bio}
        createdAt={profile.createdAt}
        avatar={avatarFor(
          profile.id,
          profile.hasAvatar,
          profile.avatarUpdatedAt,
        )}
        /* Already the public route, so the current path is the shareable one. */
        sharePath={`/u/${profile.id}`}
        aside={
          isMe ? (
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={<a href="/profile" />}
            >
              Edit your profile
            </Button>
          ) : null
        }
      />

      {/*
        Posts only. A visitor came to see what this member has written about
        things, and the replies they left in other people's threads are not part
        of that -- listing them turns a profile into an index of someone else's
        conversations. It also keeps the page to one request instead of two.
      */}
      <ProfileActivity
        userId={profile.id}
        isMe={false}
        includeComments={false}
      />
    </div>
  );
};
