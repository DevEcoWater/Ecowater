"use client";

import { TCounts } from "@/types/users/user-types";
import { Clock, ShieldOff, Users, UserCheck, UserX } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface UserSummaryCardsProps {
  counts: TCounts;
  total: number;
  isLoading: boolean;
}

const CARDS = [
  {
    key: "total",
    label: "Total",
    colorClass: "border-l-blue-500",
    iconColor: "text-blue-500",
    Icon: Users,
    getValue: (_c: TCounts, total: number) => total,
  },
  {
    key: "activos",
    label: "Activos",
    colorClass: "border-l-green-500",
    iconColor: "text-green-500",
    Icon: UserCheck,
    getValue: (c: TCounts) => c.actives,
  },
  {
    key: "inactivos",
    label: "Inactivos",
    colorClass: "border-l-slate-400",
    iconColor: "text-slate-400",
    Icon: UserX,
    getValue: (c: TCounts) => c.inactives,
  },
  {
    key: "pendientes",
    label: "Pendientes",
    colorClass: "border-l-amber-500",
    iconColor: "text-amber-500",
    Icon: Clock,
    getValue: (c: TCounts) => c.pendings,
  },
  {
    key: "bloqueados",
    label: "Bloqueados",
    colorClass: "border-l-red-500",
    iconColor: "text-red-500",
    Icon: ShieldOff,
    getValue: (c: TCounts) => c.blockeds,
  },
] as const;

export function UserSummaryCards({ counts, total, isLoading }: UserSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {CARDS.map(({ key, label, colorClass, iconColor, Icon, getValue }) => {
        const value = isLoading ? null : getValue(counts, total);

        return (
          <div
            key={key}
            className={`bg-card rounded-lg border border-l-4 ${colorClass} p-4 flex flex-col gap-2`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {label}
              </span>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
            {value === null ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <span className="text-2xl font-semibold tabular-nums">{value}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
