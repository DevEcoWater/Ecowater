import React from "react";
import { ConsumptionCard } from "./consumption-card";
import { MetersCard } from "./meters-card";
import { AlertsCard } from "./alerts-card";
import { ErrorsCard } from "./errors-card";
import { DashboardStats } from "@/hooks/dashboard/use-dashboard-stats";
import { useUrgencies } from "@/hooks/urgencies/use-urgencies";

interface SummaryCardsProps {
  stats: DashboardStats;
  color: string;
  backgroundColor: string;
}

export function SummaryCards({
  stats,
  color,
  backgroundColor,
}: SummaryCardsProps) {
  const { data: urgencies } = useUrgencies({
    includeInactive: true,
    limit: 100,
  });

  // Calcular alertas y errores según criterios del documento
  const totalAlerts =
    (urgencies?.alerts.medium.length || 0) +
    (urgencies?.alerts.low.length || 0) +
    (urgencies?.alerts.inactive.length || 0);
  const totalErrors =
    (urgencies?.alerts.critical.length || 0) +
    (urgencies?.alerts.high.length || 0);
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <ConsumptionCard
        totalConsumption={stats.readings.recent}
        period="mes"
        color={color}
        backgroundColor={backgroundColor}
      />
      <MetersCard
        totalMeters={stats.meters.total}
        onlineMeters={stats.meters.active}
        color={color}
        backgroundColor={backgroundColor}
      />
      <AlertsCard
        activeAlerts={totalAlerts}
        color={color}
        backgroundColor={backgroundColor}
      />
      <ErrorsCard
        totalErrors={totalErrors}
        color={color}
        backgroundColor={backgroundColor}
      />
    </div>
  );
}
