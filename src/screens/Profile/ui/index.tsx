"use client";

import { useRef, useState } from "react";
import { AlertCircle, Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useProfile } from "../model/useProfile";
import { ProfileActivity } from "./ProfileActivity";
import { ProfileHeader } from "./ProfileHeader";

/**
 * Where each field's error is rendered.
 *
 * Declared once so the label, the input and the message cannot drift apart: a
 * screen reader is given the message via aria-describedby, and the visible
 * message has to be the same text under the same id, or the announcement
 * describes something the sighted reader cannot see.
 */
const fieldErrorId = (field: string) => `profile-${field}-error`;

export const ProfilePage = () => {
  const {
    user,
    form,
    errors,
    isLoading,
    loadError,
    isSaving,
    avatarBusy,
    hasAvatarChanges,
    saveError,
    avatarUrl: currentAvatar,
    setField,
    submit,
    uploadAvatar,
    removeAvatar,
    reset,
    maxBio,
  } = useProfile();

  const fileInput = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (loadError || !user || !form) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Profile unavailable</CardTitle>
            <CardDescription>{loadError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /*
   * A local object URL for the image just chosen, shown while the upload is in
   * flight so the member sees their new picture immediately instead of watching
   * the old one until a round trip completes.
   *
   * Revoked on replacement and on unmount: these hold the decoded file in memory
   * for the life of the document, and a member trying three images in a row
   * would accumulate all three.
   */
  const chooseAvatar = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    setAvatarError(null);

    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(URL.createObjectURL(file));

    const error = await uploadAvatar(file);
    if (error) {
      setAvatarError(error);
      // The upload failed, so the stored avatar is unchanged. Drop the preview
      // rather than leave a picture on screen that was never saved.
      URL.revokeObjectURL(preview ?? "");
      setPreview(null);
    }
    // Reset so choosing the same file twice still fires a change event.
    if (fileInput.current) {
      fileInput.current.value = "";
    }
  };

  const onSave = () => {
    const error = saveError;
    submit();
    if (error) {
      toast.add({ type: "error", title: "Could not save", description: error });
    }
  };

  // A local object URL for the in-flight image wins over the stored one, so the
  // new picture appears immediately rather than after the upload round trip.
  const shownAvatar = preview ?? currentAvatar;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          How you appear across Tellmi.
        </p>
      </header>

      {/*
        The avatar sits in the shared header rather than in its own card, so the
        picture is not rendered twice on one page. The controls stay here because
        they are the only editable part of the header, and the header itself is
        shared with other members' profiles where there is nothing to edit.
      */}
      <ProfileHeader
        username={user.username}
        bio={form.bio}
        createdAt={user.createdAt}
        avatar={shownAvatar}
        /*
          The public /u/:id form, not the /profile route this page is on.
          `/profile` resolves to whoever is signed in, so sharing it would send
          everyone who opened the link to their own profile rather than yours --
          a link that looks right and shows the wrong person. Your own public URL
          is the only one that means the same thing to you and to the recipient.
        */
        sharePath={`/u/${user.id}`}
      />

      {/*
        Editing lives in its own tab rather than sitting above the lists. It used
        to be one long page -- form, then posts, then comments -- so checking
        something you had written meant scrolling past a form, and changing your
        name meant scrolling past everything else first. Three tabs makes each of
        them a destination rather than a section.

        The header stays outside the bar on purpose: who you are is not one of the
        three things you can do here, it is the answer to all of them, and it has
        to stay visible while the bio is edited underneath it.
      */}
      <Tabs defaultValue="profile" className="gap-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Picture</CardTitle>
              <CardDescription>
                A square image, cropped from the centre. Resized in your browser
                before it is uploaded, so the file never leaves your device at
                full size.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-3">
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                className="sr-only"
                onChange={(e) => void chooseAvatar(e.target.files?.[0])}
              />
              <Button
                variant="outline"
                disabled={avatarBusy || hasAvatarChanges}
                onClick={() => fileInput.current?.click()}
              >
                <Camera className="mr-2 size-4" />
                {user.hasAvatar ? "Replace" : "Upload"}
              </Button>
              {user.hasAvatar ? (
                <Button
                  variant="ghost"
                  disabled={avatarBusy || hasAvatarChanges}
                  onClick={async () => {
                    const error = await removeAvatar();
                    if (error) {
                      setAvatarError(error);
                      return;
                    }
                    if (preview) {
                      URL.revokeObjectURL(preview);
                      setPreview(null);
                    }
                    toast.add({ title: "Picture removed", type: "success" });
                  }}
                >
                  <Trash2 className="mr-2 size-4" />
                  Remove
                </Button>
              ) : null}

              {avatarError ? (
                <p
                  role="alert"
                  className="flex w-full items-center gap-2 text-sm text-destructive"
                >
                  <AlertCircle className="size-4 shrink-0" />
                  {avatarError}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
              <CardDescription>
                Your name shows on every post and comment you write.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  onSave();
                }}
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="profile-username">Username</Label>
                  <Input
                    id="profile-username"
                    value={form.username}
                    onChange={(e) => setField("username", e.target.value)}
                    aria-invalid={Boolean(errors.username)}
                    aria-describedby={
                      errors.username ? fieldErrorId("username") : undefined
                    }
                    autoComplete="username"
                    spellCheck={false}
                  />
                  {errors.username ? (
                    <p
                      id={fieldErrorId("username")}
                      role="alert"
                      className="flex items-center gap-2 text-sm text-destructive"
                    >
                      <AlertCircle className="size-4 shrink-0" />
                      {errors.username}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profile-email">Email</Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                      errors.email ? fieldErrorId("email") : undefined
                    }
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                  {errors.email ? (
                    <p
                      id={fieldErrorId("email")}
                      role="alert"
                      className="flex items-center gap-2 text-sm text-destructive"
                    >
                      <AlertCircle className="size-4 shrink-0" />
                      {errors.email}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Optional. Used to identify your account, never shown
                      publicly.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <Label htmlFor="profile-bio">Bio</Label>
                    <span
                      className={cn(
                        "text-xs tabular-nums",
                        form.bio.length > maxBio
                          ? "text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      {form.bio.length}/{maxBio}
                    </span>
                  </div>
                  <Textarea
                    id="profile-bio"
                    rows={4}
                    value={form.bio}
                    onChange={(e) => setField("bio", e.target.value)}
                    aria-invalid={Boolean(errors.bio)}
                    aria-describedby={
                      errors.bio ? fieldErrorId("bio") : undefined
                    }
                    placeholder="A sentence or two about you."
                  />
                  {errors.bio ? (
                    <p
                      id={fieldErrorId("bio")}
                      role="alert"
                      className="flex items-center gap-2 text-sm text-destructive"
                    >
                      <AlertCircle className="size-4 shrink-0" />
                      {errors.bio}
                    </p>
                  ) : null}
                </div>

                <Separator />

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="submit" disabled={isSaving || !form.dirty}>
                    {isSaving ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : null}
                    {isSaving ? "Saving" : "Save changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={isSaving || !form.dirty}
                    onClick={reset}
                  >
                    Discard
                  </Button>
                </div>

                {!form.dirty && !isSaving ? (
                  <p className="text-sm text-muted-foreground">
                    No unsaved changes.
                  </p>
                ) : null}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/*
        One instance supplying both activity panels. Rendering it twice would mean
        two sets of queries for the same data, and two TabsContent pairs sharing
        a value -- the second pair would be unreachable, since the primitive keys
        panels by value.
      */}
        <ProfileActivity userId={user.id} isMe panelsOnly />
      </Tabs>
    </div>
  );
};
