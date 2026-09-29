"use client";

import { FC } from "react";

interface JoinedCellProps {
  createdAt?: number;
}

/** Join date as a short day-month-year, or a dash when unknown. */
export const JoinedCell: FC<JoinedCellProps> = ({ createdAt }) => {
  if (!createdAt) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const date = new Date(createdAt);

  return (
    <span className="text-sm whitespace-nowrap">
      {date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })}
    </span>
  );
};
