"use client";

import { useDashboardStats } from "@/hooks/dashboard/use-dashboard-stats";
import { Activity, AlertTriangle, Cpu, Database, Wrench } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const CARDS = [
  {
    key: "total",
    label: "Total",
    colorClass: "border-l-blue-500",
    iconColor: "text-blue-500",
    Icon: Database,
    getValue: (m: { total: number }) => m.total,
  },
  {
    key: "smart",
    label: "Inteligentes",
    colorClass: "border-l-cyan-500",
    iconColor: "text-cyan-500",
    Icon: Cpu,
    getValue: (m: { smart: number }) => m.smart,
  },
  {
    key: "mechanical",
    label: "Mecánicos",
    colorClass: "border-l-amber-500",
    iconColor: "text-amber-500",
    Icon: Wrench,
    getValue: (m: { mechanical: number }) => m.mechanical,
  },
  {
    key: "active",
    label: "Activos",
    colorClass: "border-l-green-500",
    iconColor: "text-green-500",
    Icon: Activity,
    getValue: (m: { active: number }) => m.active,
  },
  {
    key: "issues",
    label: "Con problemas",
    colorClass: "border-l-red-500",
    iconColor: "text-red-500",
    Icon: AlertTriangle,
    getValue: (m: { maintenance: number; faulty: number }) =>
      m.maintenance + m.faulty,
  },
] as const;

export function MeterSummaryCards() {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {CARDS.map(({ key, label, colorClass, iconColor, Icon, getValue }) => {
        const value = stats ? getValue(stats.meters as any) : null;

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
            {isLoading || value === null ? (
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
