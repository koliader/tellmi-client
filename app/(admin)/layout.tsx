"use client";

import { useState, type FC, type PropsWithChildren } from "react";
import { Menu } from "lucide-react";
import { AdminGate } from "@/src/widgets/AdminGate";
import { AdminSidebar } from "@/src/widgets/AdminSidebar";
import { Button } from "@/components/ui/button";

const AdminShell: FC<PropsWithChildren> = ({ children }) => {
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar isOpen={isNavOpen} onOpenChange={setIsNavOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact header for phones, where the sidebar is a drawer. The grid
            keeps the title centred now that the theme toggle has moved out --
            with `justify-between` and only two children the title would drift
            to the right edge. */}
        <div className="grid h-14 shrink-0 grid-cols-3 items-center gap-2 border-b border-border px-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsNavOpen(true)}
            className="justify-self-start cursor-pointer"
            aria-label="Open navigation"
            aria-expanded={isNavOpen}
          >
            <Menu className="size-5" />
          </Button>
          <span className="text-center text-sm font-semibold tracking-tight">
            Tellmi Admin
          </span>
        </div>

        <main className="min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AdminGate>{<AdminShell>{children}</AdminShell>}</AdminGate>;
}
