"use client";

import { FC } from "react";
import { Badge } from "@/components/ui/badge";
import { ERole } from "@/src/share/types/token";

interface RoleCellProps {
  role: ERole;
}

export const RoleCell: FC<RoleCellProps> = ({ role }) => (
  <Badge
    variant="outline"
    className={
      role === ERole.Admin
        ? "border-destructive/30 bg-destructive/10 text-destructive"
        : undefined
    }
  >
    {role === ERole.Admin ? "ADMIN" : "USER"}
  </Badge>
);
