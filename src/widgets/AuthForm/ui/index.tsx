"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FC } from "react";
import { Loader2 } from "lucide-react";
import { tokenStorage } from "@/src/share/api/tokenStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UseMutationResult } from "@tanstack/react-query";
import { IAuthRes } from "@/src/share/api/model/users";
import { AxiosError } from "axios";
import { IQueryError } from "@/src/share/api/model/api";
import { useForm } from "react-hook-form";
import { IAuthFormValues } from "../types";

interface AuthFormProps {
  title: string;
  description: string;
  submitLabel: string;
  loadingLabel: string;
  alternateLink: { label: string; href: string; linkText: string };
  mutation: UseMutationResult<
    IAuthRes,
    AxiosError<IQueryError>,
    IAuthFormValues
  >;
}

export const AuthForm: FC<AuthFormProps> = ({
  title,
  description,
  submitLabel,
  loadingLabel,
  alternateLink,
  mutation,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<IAuthFormValues>({
    mode: "all",
    defaultValues: {
      username: "",
      password: "",
    },
  });
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
    if (tokenStorage.getPayload()) {
      router.replace("/");
    }
  }, [router]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <form
          onSubmit={handleSubmit((values) => mutation.mutate(values))}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter your username"
              disabled={mutation.isPending}
              {...register("username", {
                required: "Username is required!",
              })}
            />
            {errors?.username && (
              <div className="text-sm text-destructive">
                {errors.username.message}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              disabled={mutation.isPending}
              {...register("password", {
                required: "Password is required!",
                minLength: {
                  value: 5,
                  message: "Password must be at least 5 characters",
                },
              })}
            />
            {errors?.password && (
              <div className="text-sm text-destructive">
                {errors.password.message}
              </div>
            )}
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={mutation.isPending || (mounted && !isValid)}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {loadingLabel}
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {alternateLink.label}{" "}
          <a
            href={alternateLink.href}
            className="text-foreground underline underline-offset-4 hover:text-primary"
          >
            {alternateLink.linkText}
          </a>
        </p>
      </div>
    </div>
  );
};
