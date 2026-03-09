"use client";

import React, { useState } from "react";
import { SummaryCards } from "./summary-cards/summary-cards";
import { ConsumptionChart } from "./consumption-chart/consumption-chart";
import { DateRangeSelector } from "./date-range-selector";
import { useDashboardStats } from "@/hooks/dashboard/use-dashboard-stats";
import {
  useConsumptionData,
  DashboardPeriod,
  ConsumptionQueryParams,
} from "@/hooks/dashboard/use-consumption-data";
import { useUrgencies } from "@/hooks/dashboard/use-urgencies";
import { useMeterDistribution } from "@/hooks/dashboard/use-meter-distribution";
import { useAlarmTrends } from "@/hooks/dashboard/use-alarm-trends";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock } from "lucide-react";
import { UrgenciesSection } from "./urgencies/urgencies-section";
import { MeterDistributionChart } from "./meter-distribution-chart/meter-distribution-chart";
import { AlarmTrendsChart } from "./alarm-trends-chart/alarm-trends-chart";
import dayjs from "dayjs";

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  "7d": "1 semana",
  "30d": "1 mes",
  "90d": "3 meses",
  "6m": "6 meses",
  "1y": "1 año",
};

export function HomeDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>("30d");
  const [customRange, setCustomRange] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);

  const consumptionParams: ConsumptionQueryParams = customRange
    ? { startDate: customRange.startDate, endDate: customRange.endDate }
    : { period: selectedPeriod };

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: consumption, isLoading: consumptionLoading } =
    useConsumptionData(consumptionParams);
  const { data: urgencies, isLoading: urgenciesLoading } = useUrgencies();
  const { data: meterDistribution } = useMeterDistribution(consumptionParams);
  const { data: alarmTrends } = useAlarmTrends(consumptionParams);

  const consumptionTotal =
    consumption?.series.reduce((sum, item) => sum + item.consumo_m3, 0) ?? 0;
  const previousTotal = consumption?.previousTotal;

  const periodLabel = customRange
    ? `${dayjs(customRange.startDate).format("DD/MM/YY")} - ${dayjs(customRange.endDate).format("DD/MM/YY")}`
    : PERIOD_LABELS[selectedPeriod];

  if (statsLoading || consumptionLoading || urgenciesLoading) {
    return <DashboardSkeleton />;
  }

  if (!stats || !consumption || !urgencies) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">
            Error al cargar datos
          </h3>
          <p className="text-gray-600">
            No se pudieron cargar los datos del dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header: última actualización */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>
            Última actualización:{" "}
            {stats?.lastReadingTimestamp
              ? formatLastUpdate(stats.lastReadingTimestamp)
              : "Sin datos"}
          </span>
        </div>
      </div>

      {/* Cards de resumen */}
      <div id="tour-summary-cards">
        <SummaryCards
          stats={stats}
          consumptionTotal={consumptionTotal}
          previousTotal={previousTotal}
          period={periodLabel}
        />
      </div>

      {/* Selector de período y rango personalizado */}
      <div id="tour-date-range-selector">
        <DateRangeSelector
          selectedPeriod={selectedPeriod}
          customRange={customRange}
          onPeriodSelect={(period) => {
            setSelectedPeriod(period);
            setCustomRange(null);
          }}
          onRangeApply={(startDate, endDate) =>
            setCustomRange({ startDate, endDate })
          }
          onRangeClear={() => setCustomRange(null)}
        />
      </div>

      {/* Gráfico de consumo y urgencias */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3" id="tour-consumption-chart">
          <ConsumptionChart data={consumption} />
        </div>
        <div className="lg:col-span-1" id="tour-urgencies-section">
          <UrgenciesSection urgencies={urgencies} />
        </div>
      </div>

      {/* Tendencia de alarmas */}
      <div id="tour-alarm-trends">
        <AlarmTrendsChart data={alarmTrends} period={periodLabel} />
      </div>

      {/* Distribución por medidor */}
      <div id="tour-meter-distribution-chart">
        <MeterDistributionChart
          meters={meterDistribution?.meters ?? []}
          period={periodLabel}
        />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Skeleton className="h-6 w-48" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Skeleton className="h-96 w-full" />
        </div>
        <div className="lg:col-span-1">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>

      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function formatLastUpdate(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Desconocido";
  }
}
