"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { getInitials } from "@/utils/getInitials";

// Make UserAvatar accept props & forward them to Avatar
const UserAvatar = React.forwardRef<
  React.ElementRef<typeof Avatar>,
  React.ComponentPropsWithoutRef<typeof Avatar>
>(({ className, ...props }, ref) => {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Avatar ref={ref} className={className} {...props}>
        <AvatarFallback>
          <Loader2 className="h-4 w-4 animate-spin" />
        </AvatarFallback>
      </Avatar>
    );
  }

  if (!session?.user) {
    return (
      <Avatar ref={ref} className={className} {...props}>
        <AvatarFallback>?</AvatarFallback>
      </Avatar>
    );
  }

  const initials = getInitials(session.user.firstName, session.user.lastName);

  return (
    <Avatar ref={ref} className={className} {...props}>
      <AvatarImage alt={session.user.firstName} />
      <AvatarFallback className="cursor-pointer">{initials}</AvatarFallback>
    </Avatar>
  );
});

UserAvatar.displayName = "UserAvatar";

export default UserAvatar;
