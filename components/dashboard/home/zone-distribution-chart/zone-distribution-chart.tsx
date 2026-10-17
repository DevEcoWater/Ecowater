"use client";

import React from "react";
import { ZoneDistributionData } from "@/hooks/dashboard/use-zone-distribution";
import { ConsumptionRankingChart } from "../consumption-ranking-chart/consumption-ranking-chart";

interface ZoneDistributionChartProps {
  data: ZoneDistributionData | undefined;
  period: string;
}

export const ZoneDistributionChart = React.memo(function ZoneDistributionChart({ data, period }: ZoneDistributionChartProps) {
  const unzoned = data?.unzonedTotal ?? 0;

  // Varias zonas pueden compartir color (p. ej. el default); solo la primera lo conserva
  const usedColors = new Set<string>();
  const uniqueColor = (color: string) => {
    const key = color.toLowerCase();
    if (usedColors.has(key)) return undefined;
    usedColors.add(key);
    return color;
  };

  return (
    <ConsumptionRankingChart
      title="Zonas con mayor consumo"
      period={period}
      itemNoun="zonas"
      viewAll={{ href: "/dashboard/zonas", label: "Ver todas las zonas" }}
      footerNote={unzoned > 0 ? `Fuera de zonas: ${unzoned.toLocaleString()} m³` : undefined}
      items={(data?.zones ?? []).filter((z) => z.totalConsumo > 0).map((z) => ({
        id: z.zoneId,
        name: z.name,
        value: z.totalConsumo,
        href: `/dashboard/zonas/${z.zoneId}`,
        color: uniqueColor(z.color),
        detail: `${z.meterCount} ${z.meterCount === 1 ? "medidor" : "medidores"}`,
      }))}
    />
  );
});
