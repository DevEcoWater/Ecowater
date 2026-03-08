"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeterDistributionItem } from "@/hooks/dashboard/use-meter-distribution";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface MeterDistributionChartProps {
  meters: MeterDistributionItem[];
  period: string;
}

const COLORS = [
  "#3b82f6",
  "#06b6d4",
  "#8b5cf6",
  "#f59e0b",
  "#10b981",
  "#94a3b8",
];

const RADIAN = Math.PI / 180;

function renderCustomLabel({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: any) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function MeterDistributionChart({ meters, period }: MeterDistributionChartProps) {
  if (meters.length === 0) {
    return (
      <Card className="border-0 shadow-sm bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900">
            Distribución por medidor — {period}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-sm text-gray-400">Sin datos para el período seleccionado</p>
        </CardContent>
      </Card>
    );
  }

  // Top 5 + "Otros"
  const sorted = [...meters].sort((a, b) => b.totalConsumo - a.totalConsumo);
  const top5 = sorted.slice(0, 5);
  const rest = sorted.slice(5);
  const otrosTotal = rest.reduce((sum, m) => sum + m.totalConsumo, 0);

  const chartData = [
    ...top5.map((m) => ({ name: m.name, value: m.totalConsumo })),
    ...(otrosTotal > 0 ? [{ name: "Otros", value: otrosTotal }] : []),
  ];

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">
          Distribución por medidor — {period}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  `${value.toLocaleString()} m³ (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`,
                  "Consumo",
                ]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span className="text-xs text-gray-600">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Centro del donut: total */}
        <p className="text-center text-xs text-gray-400 -mt-2">
          Total: <span className="font-semibold text-gray-700">{total.toLocaleString()} m³</span>
        </p>
      </CardContent>
    </Card>
  );
}
