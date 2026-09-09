"use client";

import React from "react";
import { Gauge, Activity, Droplets, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardStats } from "@/hooks/dashboard/use-dashboard-stats";
import { useUrgencies } from "@/hooks/urgencies/use-urgencies";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  borderColor: string;
  isLoading: boolean;
}

function StatCard({ title, value, icon, borderColor, isLoading }: StatCardProps) {
  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="text-muted-foreground shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          {isLoading ? (
            <Skeleton className="h-6 w-16 mt-0.5" />
          ) : (
            <p className="text-xl font-bold">{value}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CooperativeOverviewCards() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: urgencies } = useUrgencies({ includeInactive: true, limit: 100 });

  // Real alert count from urgencies — same logic as the home summary cards.
  // stats.alerts.totalAlerts was counting inactive meters, not real alarms.
  const totalAlerts =
    (urgencies?.alerts.critical.length ?? 0) +
    (urgencies?.alerts.high.length ?? 0) +
    (urgencies?.alerts.medium.length ?? 0) +
    (urgencies?.alerts.low.length ?? 0);

  const cards = [
    {
      title: "Medidores",
      value: stats?.meters.total ?? 0,
      icon: <Gauge className="h-5 w-5" />,
      borderColor: "border-l-blue-500",
    },
    {
      title: "Activos",
      value: stats?.meters.active ?? 0,
      icon: <Activity className="h-5 w-5" />,
      borderColor: "border-l-green-500",
    },
    {
      title: "Consumo del mes (m³)",
      value: stats?.consumption.total ?? 0,
      icon: <Droplets className="h-5 w-5" />,
      borderColor: "border-l-cyan-500",
    },
    {
      title: "Alertas activas",
      value: totalAlerts,
      icon: <AlertTriangle className="h-5 w-5" />,
      borderColor: "border-l-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} isLoading={isLoading} />
      ))}
    </div>
  );
}
