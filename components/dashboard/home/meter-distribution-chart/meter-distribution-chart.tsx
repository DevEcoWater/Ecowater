"use client";

import React from "react";
import { MeterDistributionItem } from "@/hooks/dashboard/use-meter-distribution";
import { ConsumptionRankingChart } from "../consumption-ranking-chart/consumption-ranking-chart";

interface MeterDistributionChartProps {
  meters: MeterDistributionItem[];
  period: string;
}

export const MeterDistributionChart = React.memo(function MeterDistributionChart({ meters, period }: MeterDistributionChartProps) {
  return (
    <ConsumptionRankingChart
      title="Top consumidores"
      period={period}
      itemNoun="medidores"
      viewAll={{ href: "/dashboard/medidores", label: "Ver todos los medidores" }}
      items={meters.map((m) => ({
        id: m.meterId,
        name: m.name,
        value: m.totalConsumo,
        href: `/dashboard/medidores/${m.meterId}`,
      }))}
    />
  );
});
