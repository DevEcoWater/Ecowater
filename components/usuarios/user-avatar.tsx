import type React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatUserType } from "@/utils/formatUserType";
import { getInitials } from "@/utils/getInitials";

interface UserAvatarProps {
  firstName: string;
  lastName: string;
  role: string;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  firstName,
  lastName,
  role,
}) => {
  const initials = getInitials(firstName, lastName);

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9 bg-gray-200 text-gray-600">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {firstName + " " + lastName}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatUserType(role)}
        </span>
      </div>
    </div>
  );
};

export default UserAvatar;
