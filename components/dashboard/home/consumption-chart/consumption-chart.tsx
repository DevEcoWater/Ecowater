"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import dayjs from "dayjs";
import "dayjs/locale/es"; // 👈 importar el locale
import { getStatusColor } from "@/utils/getStatusColor";
import { MeterStatus } from "@prisma/client";
dayjs.locale("es");

interface ConsumptionChartProps {
  data: ConsumptionData;
  meterStatus?: string;
}

export function ConsumptionChart({ data, meterStatus }: ConsumptionChartProps) {
  const { color } = getStatusColor(meterStatus as MeterStatus);

  const groupBy: "day" | "week" | "month" = (() => {
    if (data.groupBy) return data.groupBy as "day" | "week" | "month";
    switch (data.period) {
      case "7d":
      case "30d":
        return "day";
      case "90d":
        return "week";
      case "1y":
        return "month";
      default:
        return "day";
    }
  })();

  const formatChartData = (series: ConsumptionData["series"]) => {
    // --- DÍAS: solo días con datos ---
    if (groupBy === "day") {
      return series.map((item) => {
        return {
          date: item.fecha,
          label:
            data.period === "30d"
              ? dayjs(item.fecha).format("DD")
              : dayjs(item.fecha).format("ddd DD MMM"),
          totalFlow: item.consumo_m3,
        };
      });
    }

    if (groupBy === "week" && data.period === "90d") {
      const end = dayjs(data.endDate); // 2025-10-03
      const start = end.subtract(90, "day"); // últimos 90 días
      const monthMap = new Map<string, number>();

      // Agrupamos cada día por mes
      series.forEach((item) => {
        const date = dayjs(item.fecha);
        if (date.isBefore(start) || date.isAfter(end)) return;
        const monthKey = date.format("YYYY-MM");
        monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + item.consumo_m3);
      });

      // Ordenamos por mes y devolvemos
      return Array.from(monthMap.entries())
        .sort(([a], [b]) => dayjs(a + "-01").diff(dayjs(b + "-01")))
        .map(([monthKey, totalFlow]) => ({
          date: monthKey,
          label: dayjs(monthKey + "-01").format("MMM YYYY"),
          totalFlow,
        }));
    }

    // --- MESES (1y) ---
    if (groupBy === "month") {
      return series.map((item) => {
        return {
          date: item.fecha,
          label: dayjs(item.fecha).format("MMMM/YYYY"),
          totalFlow: item.consumo_m3,
        };
      });
    }

    return [];
  };

  const getPeriodLabel = () => {
    switch (data.period) {
      case "7d":
        return "últimos 7 días";
      case "30d":
        return "últimos 30 días";
      case "90d":
        return "últimos 3 meses";
      case "6m":
        return "últimos 6 meses";
      case "1y":
        return "último año";
      default:
        return "Ultimos consumos del mes";
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Análisis de Consumo de Agua - {getPeriodLabel()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[21rem]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatChartData(data.series)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" stroke="#6b7280" fontSize={12} />
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
                fill={meterStatus ? color : "#3b82f6"}
                radius={[4, 4, 0, 0]}
                name="Flujo Acumulado"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
