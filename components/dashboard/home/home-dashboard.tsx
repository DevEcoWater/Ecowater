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
import { AlertCircle, Bell, DropletIcon, Gauge, Signal, Thermometer } from "lucide-react";
import { UrgenciesSection } from "./urgencies/urgencies-section";
import { MeterDistributionChart } from "./meter-distribution-chart/meter-distribution-chart";
import { AlarmTrendsChart } from "./alarm-trends-chart/alarm-trends-chart";
import { SyncPanel } from "./sync-panel";
import dayjs from "dayjs";

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  "7d": "1 semana",
  "30d": "1 mes",
  "90d": "3 meses",
  "6m": "6 meses",
  "1y": "1 año",
};

function SectionHeader({
  icon: Icon,
  title,
  color = "gray",
  children,
}: {
  icon: React.ElementType;
  title: string;
  color?: "blue" | "red" | "green" | "gray";
  children?: React.ReactNode;
}) {
  const colorMap = {
    blue:  { bg: "bg-blue-100",  icon: "text-blue-600",  bar: "bg-blue-500"  },
    red:   { bg: "bg-red-100",   icon: "text-red-500",   bar: "bg-red-500"   },
    green: { bg: "bg-green-100", icon: "text-green-600", bar: "bg-green-500" },
    gray:  { bg: "bg-muted",     icon: "text-muted-foreground", bar: "bg-muted-foreground" },
  };
  const c = colorMap[color];

  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${c.bg}`}>
          <Icon className={`w-4 h-4 ${c.icon}`} />
        </div>
        <h2 className="text-sm font-semibold text-foreground tracking-wide uppercase">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground">
            Error al cargar datos
          </h3>
          <p className="text-muted-foreground">
            No se pudieron cargar los datos del dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Barra de estado: live + señal + temp ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-4">
          {stats.signal && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Signal className="w-4 h-4" />
              <span
                className="font-medium"
                style={{
                  color:
                    stats.signal.quality === "EXCELLENT"
                      ? "#16a34a"
                      : stats.signal.quality === "GOOD"
                      ? "#d97706"
                      : "#dc2626",
                }}
              >
                {stats.signal.avgRssi} dBm
              </span>
              <span className="text-xs">
                ({stats.signal.quality === "EXCELLENT" ? "Excelente" : stats.signal.quality === "GOOD" ? "Buena" : "Débil"})
              </span>
            </div>
          )}
          {stats.temperature?.avg != null && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Thermometer className="w-4 h-4" />
              <span>{stats.temperature.avg}°C prom.</span>
            </div>
          )}
        </div>
        <SyncPanel initialTimestamp={stats?.meta?.timestamp ?? null} />
      </div>

      {/* ── Sección: Resumen ── */}
      <section id="tour-summary-cards">
        <SummaryCards
          stats={stats}
          consumptionTotal={consumptionTotal}
          previousTotal={previousTotal}
          period={periodLabel}
        />
      </section>

      {/* ── Sección: Consumo ── */}
      <section id="tour-consumption-chart">
        <SectionHeader icon={DropletIcon} title="Consumo" color="blue">
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
        </SectionHeader>
        <ConsumptionChart data={consumption} />
      </section>

      {/* ── Sección: Alarmas ── */}
      <section id="tour-alarm-trends">
        <SectionHeader icon={Bell} title="Alarmas" color="red" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AlarmTrendsChart data={alarmTrends} period={periodLabel} />
          </div>
          <div id="tour-urgencies-section">
            <UrgenciesSection urgencies={urgencies} />
          </div>
        </div>
      </section>

      {/* ── Sección: Medidores ── */}
      <section id="tour-meter-distribution-chart">
        <SectionHeader icon={Gauge} title="Medidores" color="green" />
        <MeterDistributionChart
          meters={meterDistribution?.meters ?? []}
          period={periodLabel}
        />
      </section>

    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-end">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-80 w-full" />
      </div>
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
      <div>
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

