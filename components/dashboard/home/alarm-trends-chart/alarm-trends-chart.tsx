"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlarmTrendsData } from "@/hooks/dashboard/use-alarm-trends";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AlarmTrendsChartProps {
  data: AlarmTrendsData | undefined;
  period: string;
}

const ALARM_LINES = [
  { key: "flujo_inverso", label: "Flujo inverso", color: "#ef4444" },
  { key: "tuberia_vacia", label: "Tubería vacía", color: "#f97316" },
  { key: "bateria_baja", label: "Batería baja", color: "#eab308" },
  { key: "alarma_temperatura", label: "Temperatura", color: "#3b82f6" },
  { key: "fuera_de_rango", label: "Fuera de rango", color: "#8b5cf6" },
] as const;

function formatFecha(fecha: string, groupBy: "day" | "month") {
  if (groupBy === "month") {
    const [year, month] = fecha.split("-");
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
  }
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}`;
}

export function AlarmTrendsChart({ data, period }: AlarmTrendsChartProps) {
  const hasData =
    data &&
    data.series.length > 0 &&
    data.series.some(
      (d) =>
        d.flujo_inverso > 0 ||
        d.tuberia_vacia > 0 ||
        d.bateria_baja > 0 ||
        d.alarma_temperatura > 0 ||
        d.fuera_de_rango > 0
    );

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-gray-900">
          Tendencia de alarmas — {period}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm text-gray-400">
              No se registraron alarmas en el período seleccionado
            </p>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data!.series.map((d) => ({
                  ...d,
                  label: formatFecha(d.fecha, data!.groupBy),
                }))}
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number, name: string) => {
                    const line = ALARM_LINES.find((l) => l.key === name);
                    return [value, line?.label ?? name];
                  }}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => {
                    const line = ALARM_LINES.find((l) => l.key === value);
                    return (
                      <span className="text-xs text-gray-600">
                        {line?.label ?? value}
                      </span>
                    );
                  }}
                />
                {ALARM_LINES.map(({ key, color }) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
