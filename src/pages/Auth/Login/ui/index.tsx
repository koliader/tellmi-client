"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { tokenStorage } from "@/src/share/api/tokenStorage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation } from "@tanstack/react-query";
import { UsersApiService } from "@/src/share/api/UsersApiService";
import { IAuthRes, ILoginReq } from "@/src/share/api/model/users";
import { AxiosError } from "axios";
import { IQueryError } from "@/src/share/api/model/api";
import { toast } from "@/components/ui/toast";
import { useForm } from "react-hook-form";

const usersApi = new UsersApiService();

export const LoginPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onSubmit",
  });
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { mutate, isPending } = useMutation<
    IAuthRes,
    AxiosError<IQueryError>,
    ILoginReq
  >({
    mutationKey: ["login"],
    mutationFn: usersApi.login.bind(usersApi),
    onSuccess(data) {
      console.log(data);
      toast.add({
        title: "Authentication",
        description: "User authenticated!",
      });
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      // router.refresh();
    },
    onError(err) {
      toast.add({
        title: "Authentication",
        description: `Err to authenticate user ${(err as AxiosError<IQueryError>)?.response?.data.error || "Login failed"}`,
      });
    },
  });

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your Tellmi account
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutate({ username, password });
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <a
            href="/auth/register"
            className="text-foreground underline underline-offset-4 hover:text-primary"
          >
            Register
          </a>
        </p>
      </div>
    </div>
  );
};
