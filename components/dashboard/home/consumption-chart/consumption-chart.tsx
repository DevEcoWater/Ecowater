"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PeriodSelector } from "./period-selector";
import { ConsumptionData } from "@/hooks/dashboard/use-consumption-data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ConsumptionChartProps {
  data: ConsumptionData;
  period: "7d" | "30d" | "90d";
  onPeriodChange: (period: "7d" | "30d" | "90d") => void;
}

export function ConsumptionChart({
  data,
  period,
  onPeriodChange,
}: ConsumptionChartProps) {
  const formatChartData = (chartData: ConsumptionData["chartData"]) => {
    return chartData.map((item) => ({
      ...item,
      date: formatDate(item.date),
      totalFlow: Math.round(item.totalFlow * 100) / 100, // Redondear a 2 decimales
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "7d":
        return "7 días";
      case "30d":
        return "30 días";
      case "90d":
        return "90 días";
      default:
        return "7 días";
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Análisis de Consumo de Agua - {getPeriodLabel(period)}
          </CardTitle>
          <PeriodSelector
            currentPeriod={period}
            onPeriodChange={onPeriodChange}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Métricas del período */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Consumo Total</p>
              <p className="text-lg font-semibold text-blue-600">
                {data.metrics.totalConsumption.toFixed(2)} m³
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Promedio Diario</p>
              <p className="text-lg font-semibold text-green-600">
                {data.metrics.averageDailyConsumption.toFixed(2)} m³
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Lecturas</p>
              <p className="text-lg font-semibold text-purple-600">
                {data.metrics.totalReadings}
              </p>
            </div>
          </div>

          {/* Gráfico */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formatChartData(data.chartData)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  label={{
                    value: "Consumo (m³)",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 12,
                    fill: "#6b7280",
                  }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value} m³`, "Consumo"]}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Bar
                  dataKey="totalFlow"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  name="Flujo Acumulado"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
