import React from "react";
import { ConsumptionCard } from "./consumption-card";
import { MetersCard } from "./meters-card";
import { AlertsCard } from "./alerts-card";
import { ErrorsCard } from "./errors-card";
import { DashboardStats } from "@/hooks/dashboard/use-dashboard-stats";
import { useUrgencies } from "@/hooks/urgencies/use-urgencies";

interface SummaryCardsProps {
  stats: DashboardStats;
  consumptionTotal: number;
  previousTotal?: number;
  period: string;
}

export function SummaryCards({ stats, consumptionTotal, previousTotal, period }: SummaryCardsProps) {
  const { data: urgencies } = useUrgencies({
    includeInactive: true,
    limit: 100,
  });

  const totalErrors =
    (urgencies?.alerts.critical.length || 0) +
    (urgencies?.alerts.high.length || 0);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <ConsumptionCard
        totalConsumption={consumptionTotal}
        previousTotal={previousTotal}
        period={period}
      />
      <MetersCard
        totalMeters={stats.meters.total}
        onlineMeters={stats.meters.active}
      />
      <AlertsCard activeAlerts={stats.alerts.totalAlerts} />
      <ErrorsCard totalErrors={totalErrors} />
    </div>
  );
}
