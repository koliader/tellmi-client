"use client";

import { FC } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { IUserRes } from "@/src/share/api/model/users";

interface UserCellProps {
  user: IUserRes;
}

/** Avatar plus display name, as shown in the users table. */
export const UserCell: FC<UserCellProps> = ({ user }) => (
  <div className="flex items-center gap-2">
    <Avatar className="size-8">
      <AvatarFallback className="text-xs">
        {user.username?.charAt(0).toUpperCase() ?? "?"}
      </AvatarFallback>
    </Avatar>
    <span className="font-medium">{user.username}</span>
  </div>
);
