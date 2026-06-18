"use client";

import React, { useRef, useState } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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

export function HomeDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>("30d");
  const [customRange, setCustomRange] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);

  const consumptionParams: ConsumptionQueryParams = customRange
    ? { startDate: customRange.startDate, endDate: customRange.endDate }
    : { period: selectedPeriod };

  const [activeTab, setActiveTab] = useState("consumo");
  const tabsSectionRef = useRef<HTMLDivElement>(null);

  const showAlarms = () => {
    setActiveTab("alarmas");
    setTimeout(() => {
      tabsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: consumption, isLoading: consumptionLoading } =
    useConsumptionData(consumptionParams);
  const { data: urgencies, isLoading: urgenciesLoading } = useUrgencies();
  const { data: meterDistribution } = useMeterDistribution(consumptionParams);
  const { data: alarmTrends } = useAlarmTrends(consumptionParams);

  const consumptionTotal =
    consumption?.series.reduce((sum, item) => sum + item.consumo_m3, 0) ?? 0;
  const previousTotal = consumption?.previousTotal;
  const smartTotal =
    consumption?.series.reduce((sum, s) => sum + (s.consumo_smart_m3 ?? 0), 0) ?? 0;
  const mechTotal =
    consumption?.series.reduce((sum, s) => sum + (s.consumo_mech_m3  ?? 0), 0) ?? 0;

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
    <div className="space-y-6">

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

      {/* ── Resumen ── */}
      <section id="tour-summary-cards">
        <SummaryCards
          stats={stats}
          consumptionTotal={consumptionTotal}
          previousTotal={previousTotal}
          period={periodLabel}
          smartTotal={smartTotal}
          mechTotal={mechTotal}
          onShowAlarms={showAlarms}
        />
      </section>

      {/* ── Tabs: Consumo / Alarmas / Medidores ── */}
      <div ref={tabsSectionRef}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">

        {/* Cabecera: selector de período + tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <TabsList className="w-fit">
            <TabsTrigger value="consumo" className="flex items-center gap-1.5 cursor-pointer">
              <DropletIcon className="w-3.5 h-3.5" />
              <span>Consumo</span>
            </TabsTrigger>
            <TabsTrigger value="alarmas" className="flex items-center gap-1.5 cursor-pointer">
              <Bell className="w-3.5 h-3.5" />
              <span>Alarmas</span>
            </TabsTrigger>
            <TabsTrigger value="medidores" className="flex items-center gap-1.5 cursor-pointer">
              <Gauge className="w-3.5 h-3.5" />
              <span>Medidores</span>
            </TabsTrigger>
          </TabsList>

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

        {/* ── Tab: Consumo ── */}
        <TabsContent value="consumo" id="tour-consumption-chart">
          <ConsumptionChart data={consumption} />
        </TabsContent>

        {/* ── Tab: Alarmas ── */}
        <TabsContent value="alarmas" id="tour-alarm-trends">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AlarmTrendsChart data={alarmTrends} period={periodLabel} />
            </div>
            <div id="tour-urgencies-section">
              <UrgenciesSection urgencies={urgencies} />
            </div>
          </div>
        </TabsContent>

        {/* ── Tab: Medidores ── */}
        <TabsContent value="medidores" id="tour-meter-distribution-chart">
          <MeterDistributionChart
            meters={meterDistribution?.meters ?? []}
            period={periodLabel}
          />
        </TabsContent>

      </Tabs>
      </div>

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

