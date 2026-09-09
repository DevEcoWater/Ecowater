"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConsumptionData } from "@/hooks/dashboard/use-consumption-data";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

interface ConsumptionTrendChartProps {
  data: ConsumptionData;
  period: string;
}

export const ConsumptionTrendChart = React.memo(function ConsumptionTrendChart({ data, period }: ConsumptionTrendChartProps) {
  const chartData = data.series.map((item) => ({
    label:
      data.groupBy === "month"
        ? dayjs(item.fecha + "-01").format("MMM YY")
        : dayjs(item.fecha).format("DD MMM"),
    value: item.consumo_m3,
  }));

  if (chartData.length === 0) {
    return (
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900">
            Tendencia de consumo — {period}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-sm text-gray-400">Sin datos para el período seleccionado</p>
        </CardContent>
      </Card>
    );
  }

  const avg =
    chartData.reduce((sum, d) => sum + d.value, 0) / chartData.length;

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">
          Tendencia de consumo — {period}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%" debounce={250}>
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="consumoGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#94a3b8"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={45}
                tickFormatter={(v) => `${v} m³`}
              />
              <Tooltip
                formatter={(value: number) => [`${value.toLocaleString()} m³`, "Consumo"]}
                labelFormatter={(label) => label}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
              />
              <ReferenceLine
                y={avg}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{ value: "Prom.", position: "right", fontSize: 10, fill: "#94a3b8" }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#consumoGradient)"
                dot={chartData.length <= 15 ? { r: 3, fill: "#3b82f6", strokeWidth: 0 } : false}
                activeDot={{ r: 5, fill: "#3b82f6" }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-400 text-right mt-1">
          Promedio: <span className="font-medium text-gray-600">{avg.toFixed(2)} m³</span>
        </p>
      </CardContent>
    </Card>
  );
});
