"use client";

import { FC } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackLinkProps {
  href: string;
  label: string;
}

/**
 * Back navigation, matching the create-post form: a link that nudges left on
 * hover rather than a boxed button.
 */
export const BackLink: FC<BackLinkProps> = ({ href, label }) => (
  <Link
    className="flex w-fit items-center gap-1 cursor-pointer hover:-translate-x-1 transition-transform duration-200"
    href={href}
  >
    <ArrowLeft strokeWidth={1.75} size="16px" />
    <span className="text-sm">{label}</span>
  </Link>
);
