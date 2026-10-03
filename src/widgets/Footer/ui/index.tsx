"use client";

import { FC } from "react";
import Link from "next/link";
import { MessageSquareText, PenLine, ShieldCheck } from "lucide-react";
import { useCurrentUser } from "@/src/share/api/useCurrentUser";
import { ERole } from "@/src/share/types/token";

interface FooterColumn {
  label: string;
  links: { title: string; href: string; icon?: React.ComponentType<{ className?: string }> }[];
}

/**
 * Site footer.
 *
 * Only routes that actually exist are linked. There is no about page, no
 * privacy policy and no social account for this project, so those columns are
 * absent rather than present-and-broken: a footer full of dead links is worse
 * than a short one.
 *
 * The reveal animation is CSS scroll-driven (`animation-timeline: view()`),
 * which needs no animation library. Browsers without support simply render the
 * final state, so nothing is ever stuck invisible.
 */
export const Footer: FC = () => {
  const { payload, username } = useCurrentUser();
  const isAdmin = payload?.role === ERole.Admin;

  const explore: FooterColumn = {
    label: "Explore",
    links: [
      { title: "All posts", href: "/posts" },
      { title: "Write a post", href: "/posts/create", icon: PenLine },
    ],
  };

  // Signed-in non-admins have no page of their own to link to, so the column
  // degrades to a line of text rather than rendering an empty list.
  const account: FooterColumn = {
    label: "Account",
    links: isAdmin
      ? [
          { title: "Admin panel", href: "/admin", icon: ShieldCheck },
          { title: "Manage categories", href: "/admin/categories" },
        ]
      : payload
        ? []
        : [
            { title: "Log in", href: "/auth/login" },
            { title: "Create an account", href: "/auth/register" },
          ],
  };

  const columns = [explore, account];

  return (
    <footer className="relative z-10 mt-auto w-full">
      {/* A hairline of light where the footer meets the page, drawn with the
          primary token so it inverts with the theme rather than staying white. */}
      <div
        aria-hidden
        className="from-primary/25 h-px w-full bg-gradient-to-r via-transparent to-transparent"
      />

      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 rounded-sm focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary">
                <MessageSquareText
                  className="size-4 text-primary-foreground"
                  aria-hidden
                />
              </span>
              <span className="text-lg font-semibold tracking-tight">
                Tellmi
              </span>
            </Link>

            <p className="mt-4 max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
              A community discussion board. Post a thought, then talk about it.
            </p>

            <p className="mt-6 text-xs text-muted-foreground">
              © {new Date().getFullYear()} Tellmi
            </p>
          </div>

          {columns.map((column) => (
            <nav key={column.label} aria-label={column.label}>
              <h2 className="text-xs font-medium">{column.label}</h2>

              {column.links.length > 0 ? (
                <ul className="mt-4 space-y-2.5 text-sm">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="inline-flex items-center gap-2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                      >
                        {link.icon ? (
                          <link.icon className="size-4" aria-hidden />
                        ) : null}
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Signed in as{" "}
                  <span className="text-foreground">{username || "you"}</span>.
                </p>
              )}
            </nav>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
