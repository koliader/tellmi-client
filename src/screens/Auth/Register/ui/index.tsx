"use client";

import { tokenStorage } from "@/src/share/api/tokenStorage";
import { useMutation } from "@tanstack/react-query";
import { UsersApiService } from "@/src/share/api/UsersApiService";
import { IAuthRes, IRegisterReq } from "@/src/share/api/model/users";
import { AxiosError } from "axios";
import { IQueryError } from "@/src/share/api/model/api";
import { toast } from "@/components/ui/toast";
import { AuthForm } from "@/src/widgets/AuthForm";

const usersApi = new UsersApiService();

export const RegisterPage = () => {
  const mutation = useMutation<
    IAuthRes,
    AxiosError<IQueryError>,
    IRegisterReq
  >({
    mutationKey: ["register"],
    mutationFn: usersApi.register.bind(usersApi),
    onSuccess(data) {
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      toast.add({
        title: "Registration",
        description: "Account created!",
      });
      window.location.reload();
    },
    onError(err) {
      toast.add({
        title: "Registration",
        description: `Failed to register ${(err as AxiosError<IQueryError>)?.response?.data.error || "Registration failed"}`,
      });
    },
  });

  return (
    <AuthForm
      title="Create an account"
      description="Sign up to get started with Tellmi"
      submitLabel="Register"
      loadingLabel="Creating account..."
      alternateLink={{ label: "Already have an account?", href: "/auth/login", linkText: "Sign in" }}
      mutation={mutation}
    />
  );
};
