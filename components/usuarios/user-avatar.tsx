import type React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
  console.log(firstName, lastName, role);

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9 bg-gray-200 text-gray-600">
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {firstName + " " + lastName}
        </span>
        <span className="text-xs text-muted-foreground">{role}</span>
      </div>
    </div>
  );
};

export default UserAvatar;
