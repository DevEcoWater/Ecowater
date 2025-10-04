"use client";

import React, { useState } from "react";
import { SummaryCards } from "./summary-cards/summary-cards";
import { ConsumptionChart } from "./consumption-chart/consumption-chart";
import { useDashboardStats } from "@/hooks/dashboard/use-dashboard-stats";
import { useConsumptionData } from "@/hooks/dashboard/use-consumption-data";
import { useUrgencies } from "@/hooks/dashboard/use-urgencies";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock } from "lucide-react";
import { UrgenciesSection } from "./urgencies/urgencies-section";
import { getStatusColor } from "@/utils/getStatusColor";

export function HomeDashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: consumption, isLoading: consumptionLoading } =
    useConsumptionData();
  const { data: urgencies, isLoading: urgenciesLoading } = useUrgencies();

  const { color, backgroundColor } = getStatusColor(
    stats?.meters?.overallStatus
  );

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
      {/* Header con última actualización */}
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
      <SummaryCards
        stats={stats}
        color={color}
        backgroundColor={backgroundColor}
      />

      {/* Gráfico de consumo y urgencias */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Gráfico de consumo (80%) */}
        <div className="lg:col-span-3">
          <ConsumptionChart
            data={consumption}
            meterStatus={stats?.meters?.overallStatus}
          />
        </div>

        {/* Sección de urgencias (20%) */}
        <div className="lg:col-span-1">
          <UrgenciesSection urgencies={urgencies} />
        </div>
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
