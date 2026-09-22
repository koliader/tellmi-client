"use client";

import { useEffect, useState, type FC, type PropsWithChildren } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { tokenStorage } from "@/src/share/api/tokenStorage";

type Status = "checking" | "ok" | "redirect-login" | "redirect-home";

export const AdminGate: FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    const payload = tokenStorage.getPayload();
    if (!payload) {
      setStatus("redirect-login");
    } else if (payload.role !== "ADMIN") {
      setStatus("redirect-home");
    } else {
      setStatus("ok");
    }
  }, []);

  useEffect(() => {
    if (status === "redirect-login") {
      router.replace("/auth/login");
    }
    if (status === "redirect-home") {
      router.replace("/");
    }
  }, [status, router]);

  if (status !== "ok") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
};