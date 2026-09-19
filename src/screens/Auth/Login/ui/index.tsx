"use client";

import { tokenStorage } from "@/src/share/api/tokenStorage";
import { useMutation } from "@tanstack/react-query";
import { UsersApiService } from "@/src/share/api/UsersApiService";
import { IAuthRes, ILoginReq } from "@/src/share/api/model/users";
import { AxiosError } from "axios";
import { IQueryError } from "@/src/share/api/model/api";
import { toast } from "@/components/ui/toast";
import { AuthForm } from "@/src/widgets/AuthForm";

const usersApi = new UsersApiService();

export const LoginPage = () => {
  const mutation = useMutation<
    IAuthRes,
    AxiosError<IQueryError>,
    ILoginReq
  >({
    mutationKey: ["login"],
    mutationFn: usersApi.login.bind(usersApi),
    onSuccess(data) {
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      toast.add({
        title: "Authentication",
        description: "User authenticated!",
      });
      window.location.reload();
    },
    onError(err) {
      toast.add({
        title: "Authentication",
        description: `Err to authenticate user ${(err as AxiosError<IQueryError>)?.response?.data.error || "Login failed"}`,
      });
    },
  });

  return (
    <AuthForm
      title="Welcome back"
      description="Sign in to your Tellmi account"
      submitLabel="Sign in"
      loadingLabel="Signing in..."
      alternateLink={{ label: "Don't have an account?", href: "/auth/register", linkText: "Register" }}
      mutation={mutation}
    />
  );
};
