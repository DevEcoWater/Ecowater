"use client";

import { UserDataForTable } from "@/types/users/user-types";
import { Activity, Mail, MapPin } from "lucide-react";
import Chip from "@/components/ui/chip";
import { Badge } from "@/components/ui/badge";
import UserAvatar from "./user-avatar";
import { UserActions } from "./user-actions";

interface UserCardProps {
  user: UserDataForTable;
  onClick: () => void;
}

export function UserCard({ user, onClick }: UserCardProps) {
  const address = user.address?.data?.split(",")[0] ?? null;
  const meters = (user.userMeters as any) ?? [];
  const hasMeter = Array.isArray(meters) ? meters.length > 0 : !!meters;

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
    >
      {/* Header: avatar + actions menu */}
      <div className="flex items-start justify-between gap-2">
        <UserAvatar
          firstName={user.firstName}
          lastName={user.lastName}
          role={user.role ?? ""}
        />
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <UserActions user={user} />
        </div>
      </div>

      {/* Body: email + address */}
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{user.email}</span>
        </div>
        {address && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{address}</span>
          </div>
        )}
      </div>

      {/* Footer: status chip + meter badge */}
      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
        <Chip status={user.status} />
        {hasMeter ? (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1 font-medium hover:bg-blue-200 cursor-default">
            <Activity className="h-3 w-3" />
            Asignado
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground gap-1 font-normal">
            <Activity className="h-3 w-3 opacity-40" />
            Sin medidor
          </Badge>
        )}
      </div>
    </div>
  );
}
