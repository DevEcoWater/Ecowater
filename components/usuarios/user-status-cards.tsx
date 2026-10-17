"use client";

import { Clock, ShieldOff, Users, UserCheck, UserX } from "lucide-react";
import { StatusFilterCards } from "@/components/ui/status-filter-cards";
import { TCounts } from "@/types/users/user-types";

interface UserStatusCardsProps {
  value: string;
  onChange: (value: string) => void;
  counts?: TCounts;
  isLoading?: boolean;
}

export function UserStatusCards({ value, onChange, counts, isLoading }: UserStatusCardsProps) {
  return (
    <StatusFilterCards
      value={value}
      onChange={onChange}
      isLoading={isLoading}
      options={[
        {
          value: "total",
          label: "Total",
          Icon: Users,
          color: "blue",
          count: counts && counts.actives + counts.inactives + counts.pendings + counts.blockeds,
        },
        { value: "activo", label: "Activos", Icon: UserCheck, color: "green", count: counts?.actives },
        { value: "inactivo", label: "Inactivos", Icon: UserX, color: "slate", count: counts?.inactives },
        { value: "pendiente", label: "Pendientes", Icon: Clock, color: "amber", count: counts?.pendings },
        { value: "bloqueado", label: "Bloqueados", Icon: ShieldOff, color: "red", count: counts?.blockeds },
      ]}
    />
  );
}
