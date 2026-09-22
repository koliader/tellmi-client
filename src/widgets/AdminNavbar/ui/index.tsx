"use client";

import { useState, type FC } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";
import { tokenStorage } from "@/src/share/api/tokenStorage";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/categories", label: "Categories", icon: Tags },
];

export const AdminNavbar: FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  const handleLogout = () => {
    tokenStorage.clearTokens();
    toast.add({
      title: "Logout",
      description: "You have been logged out.",
    });
    router.replace("/auth/login");
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-destructive">
              <ShieldCheck className="size-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">
                Tellmi Admin
              </span>
              <span className="text-[10px] text-muted-foreground">
                Management panel
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const active = link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href);
              return (
                <Button
                  key={link.href}
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  nativeButton={false}
                  render={<Link href={link.href} />}
                >
                  <link.icon className="size-4" />
                  {link.label}
                </Button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link href="/" />}
            >
              <ExternalLink className="size-4" />
              View site
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsLogoutOpen(true)}
              className="cursor-pointer"
            >
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <AlertDialog open={isLogoutOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out of the admin panel?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to manage the panel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsLogoutOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="cursor-pointer"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};