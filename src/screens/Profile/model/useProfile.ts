"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { UsersApiService, MAX_AVATAR_BYTES } from "@/src/share/api/UsersApiService";
import { IQueryError } from "@/src/share/api/model/api";
import { IUserRes, IUpdateUserReq } from "@/src/share/api/model/users";
import { avatarUrl } from "@/src/share/lib/avatar";
import { resizeAvatar } from "@/src/share/lib/resizeAvatar";

/** Matches the API's bound, so the form can say so before a round trip. */
const MAX_BIO = 500;
const MIN_USERNAME = 3;
const MAX_USERNAME = 32;

/**
 * The form's own view of the member, seeded from the server's copy.
 *
 * Held separately from the query cache on purpose. The query is the truth about
 * what the server has; this is what the member is currently editing. Tying the
 * two together is what makes a form fight the person filling it in -- a refetch
 * arriving mid-edit overwrites the field being typed in.
 *
 * `dirty` is tracked by comparing against the seed rather than by flipping a flag
 * on every keystroke, so it is correct even if the member types a character and
 * deletes it again, and it survives the seed being replaced after a save.
 */
export interface ProfileFormState {
  username: string;
  email: string;
  bio: string;
  dirty: boolean;
}

export interface ProfileFieldErrors {
  username?: string;
  email?: string;
  bio?: string;
}

const validate = (values: {
  username: string;
  email: string;
  bio: string;
}): ProfileFieldErrors => {
  const errors: ProfileFieldErrors = {};

  const username = values.username.trim();
  if (username.length < MIN_USERNAME) {
    errors.username = `At least ${MIN_USERNAME} characters`;
  } else if (username.length > MAX_USERNAME) {
    errors.username = `At most ${MAX_USERNAME} characters`;
  }

  // Deliberately loose. The authoritative check is the API's, and duplicating
  // its rules here would only produce two answers to the same question.
  const email = values.email.trim();
  if (email.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "That does not look like an email address";
  }

  if (values.bio.length > MAX_BIO) {
    errors.bio = `At most ${MAX_BIO} characters`;
  }

  return errors;
};

const toForm = (user: IUserRes): ProfileFormState => ({
  username: user.username ?? "",
  email: user.email ?? "",
  bio: user.bio ?? "",
  dirty: false,
});

export const useProfile = () => {
  const queryClient = useQueryClient();
  const api = new UsersApiService();

  const meQuery = useQuery<IUserRes, AxiosError<IQueryError>>({
    queryKey: ["me"],
    queryFn: () => api.getMe(),
  });

  const [form, setForm] = useState<ProfileFormState | null>(null);
  const [errors, setErrors] = useState<ProfileFieldErrors>({});
  const [avatarBusy, setAvatarBusy] = useState(false);

  /*
   * Seeded once, when the member's copy first arrives.
   *
   * Resolved during render rather than by setting state inside the effect body,
   * which would paint an empty form for a commit and then fill it -- a visible
   * flash on every load, and the `react-hooks/set-state-in-effect` pattern. The
   * `form === null` guard makes this idempotent, so a later refetch does not
   * clobber what is being typed.
   */
  const user = meQuery.data;
  if (form === null && user) {
    setForm(toForm(user));
  }

  const serverError = useCallback((error: unknown): string => {
    const message = (error as AxiosError<IQueryError>)?.response?.data?.error;
    return typeof message === "string" && message.length > 0
      ? message
      : "Something went wrong. Please try again.";
  }, []);

  const updateMutation = useMutation<IUserRes, AxiosError<IQueryError>, IUpdateUserReq>({
    mutationKey: ["update profile"],
    mutationFn: (req: IUpdateUserReq) => api.updateMe(req),
    /*
     * The server's copy is the truth and the form's seed has to match it, so a
     * successful save writes straight through the cache. Every avatar in the app
     * reads the same member object, and a rename has to reach the navbar's
     * avatar and name as well as this page.
     */
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
      setForm(toForm(updated));
      setErrors({});
    },
  });

  const avatarMutation = useMutation<IUserRes, AxiosError<IQueryError>, File>({
    mutationKey: ["update avatar"],
    mutationFn: async (file: File) => {
      // Resized before upload: a phone photo is routinely megabytes and the API
      // stores at most MAX_AVATAR_BYTES, so sending one untouched is rejected.
      const { blob, contentType } = await resizeAvatar(file);
      return api.setAvatar(await blob.arrayBuffer(), contentType);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
    },
  });

  const removeAvatarMutation = useMutation<IUserRes, AxiosError<IQueryError>, void>({
    mutationKey: ["remove avatar"],
    mutationFn: () => api.removeAvatar(),
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
    },
  });

  const setField = useCallback(
    (field: "username" | "email" | "bio", value: string) => {
      setForm((current) => {
        if (!current) {
          return current;
        }
        const next = { ...current, [field]: value };
        return {
          ...next,
          // Compared against the previous values, so retyping a character that
          // was already there does not mark the form dirty.
          dirty:
            next.username !== toForm(user!).username ||
            next.email !== toForm(user!).email ||
            next.bio !== toForm(user!).bio,
        };
      });
      // Clear a field's error as soon as it is edited. Leaving it up while the
      // member is fixing the value is the most common way a form talks over the
      // person using it.
      setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
    },
    [user],
  );

  const submit = useCallback(() => {
    if (!form) {
      return;
    }
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      return;
    }
    // Every field is sent, including empty ones: the API reads an absent field
    // as "clear this", so sending only the changed ones would delete the rest.
    updateMutation.mutate({
      username: form.username.trim(),
      email: form.email.trim(),
      bio: form.bio.trim(),
    });
  }, [form, updateMutation]);

  const uploadAvatar = useCallback(
    async (file: File) => {
      setAvatarBusy(true);
      try {
        await avatarMutation.mutateAsync(file);
        return null;
      } catch (error) {
        return error instanceof Error
          ? error.message
          : serverError(error);
      } finally {
        setAvatarBusy(false);
      }
    },
    [avatarMutation, serverError],
  );

  const removeAvatar = useCallback(async () => {
    try {
      await removeAvatarMutation.mutateAsync();
      return null;
    } catch (error) {
      return serverError(error);
    }
  }, [removeAvatarMutation, serverError]);

  return {
    user,
    form,
    errors,
    isLoading: meQuery.isLoading,
    loadError: meQuery.isError ? serverError(meQuery.error) : null,
    isSaving: updateMutation.isPending,
    avatarBusy,
    hasAvatarChanges: avatarMutation.isPending || removeAvatarMutation.isPending,
    saveError: updateMutation.isError ? serverError(updateMutation.error) : null,
    avatarUrl: user
      ? avatarUrl(user.id, user.hasAvatar, user.avatarUpdatedAt)
      : null,
    setField,
    submit,
    uploadAvatar,
    removeAvatar,
    reset: () => user && setForm(toForm(user)),
    maxBio: MAX_BIO,
    maxUploadBytes: MAX_AVATAR_BYTES,
  };
};
