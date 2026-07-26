"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { LogOut, MessageSquare } from "lucide-react";
import { tokenStorage } from "@/src/share/api/tokenStorage";
import type { IPayload } from "@/src/share/types/token";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navbar = () => {
  const [payload, setPayload] = useState<IPayload | null>(null);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setPayload(tokenStorage.getPayload());
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const handleLogout = () => {
    tokenStorage.clearTokens();
    setPayload(null);
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <MessageSquare className="size-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Tellmi</span>
        </Link>

        <div className="flex items-center gap-2">
          {payload ? (
            <>
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/posts" />}>
                Posts
              </Button>
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/categories" />}>
                Categories
              </Button>

              <Separator orientation="vertical" className="mx-1 h-6" />

              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" className="gap-2 px-2" />}>
                  <Badge
                    variant={payload.role === "ADMIN" ? "destructive" : "secondary"}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {payload.role}
                  </Badge>
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                      {payload.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{payload.username}</p>
                    <p className="text-xs text-muted-foreground">{payload.role}</p>
                  </div>
                  <DropdownMenuItem onClick={handleLogout} variant="destructive">
                    <LogOut className="mr-2 size-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/auth/login" />}>
                Login
              </Button>
              <Button size="sm" nativeButton={false} render={<Link href="/auth/register" />}>
                Register
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
