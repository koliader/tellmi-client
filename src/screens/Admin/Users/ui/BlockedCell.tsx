"use client";

import { FC } from "react";
import { Badge } from "@/components/ui/badge";

interface BlockedCellProps {
  isBlocked: boolean;
}

export const BlockedCell: FC<BlockedCellProps> = ({ isBlocked }) =>
  isBlocked ? (
    <Badge
      variant="outline"
      className="border-destructive/30 bg-destructive/10 text-destructive"
    >
      Blocked
    </Badge>
  ) : (
    <Badge variant="outline" className="text-muted-foreground">
      Active
    </Badge>
  );
