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

interface ConsumptionChartProps {
  data: ConsumptionData;
}

export function ConsumptionChart({ data }: ConsumptionChartProps) {
  const formatChartData = (series: ConsumptionData["series"]) => {
    return series.map((item) => ({
      ...item,
      date: formatDate(item.fecha),
      totalFlow: item.consumo_m3, // Ya viene redondeado de la API
    }));
  };

  const formatDate = (dateString: string) => {
    // Parsear la fecha correctamente (YYYY-MM-DD)
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    // Si es agrupación por mes, mostrar solo mes y año
    if (data.groupBy === "month") {
      return date.toLocaleDateString("es-ES", {
        month: "short",
        year: "2-digit",
      });
    }

    // Si es agrupación por día, mostrar día y mes
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
  };

  const getPeriodLabel = () => {
    return "mes actual";
  };

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Análisis de Consumo de Agua - {getPeriodLabel()}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Gráfico */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formatChartData(data.series)}>
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
