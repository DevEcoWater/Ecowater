"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConsumptionData } from "@/hooks/dashboard/use-consumption-data";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import dayjs from "dayjs";
import "dayjs/locale/es";
import { getStatusColor } from "@/utils/getStatusColor";
import { MeterStatus } from "@prisma/client";
dayjs.locale("es");

const CHART_COLORS = {
  smart: "#3b82f6",
  mech:  "#f59e0b",
  total: "#3b82f6",
} as const;

interface ConsumptionChartProps {
  data: ConsumptionData;
  meterStatus?: string;
}

export const ConsumptionChart = React.memo(function ConsumptionChart({ data, meterStatus }: ConsumptionChartProps) {
  const { color } = getStatusColor(meterStatus as MeterStatus);

  const hasSplit =
    data.series.some((s) => (s.consumo_smart_m3 ?? 0) > 0) &&
    data.series.some((s) => (s.consumo_mech_m3  ?? 0) > 0);

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
      return series.map((item) => ({
        date: item.fecha,
        label:
          data.period === "30d"
            ? dayjs(item.fecha).format("DD")
            : dayjs(item.fecha).format("ddd DD MMM"),
        totalFlow: item.consumo_m3,
        smart: item.consumo_smart_m3 ?? 0,
        mech:  item.consumo_mech_m3  ?? 0,
      }));
    }

    if (groupBy === "week" && data.period === "90d") {
      const end = dayjs(data.endDate);
      const start = end.subtract(90, "day");
      const monthMap = new Map<string, { total: number; smart: number; mech: number }>();

      series.forEach((item) => {
        const date = dayjs(item.fecha);
        if (date.isBefore(start) || date.isAfter(end)) return;
        const monthKey = date.format("YYYY-MM");
        const cur = monthMap.get(monthKey) ?? { total: 0, smart: 0, mech: 0 };
        monthMap.set(monthKey, {
          total: cur.total + item.consumo_m3,
          smart: cur.smart + (item.consumo_smart_m3 ?? 0),
          mech:  cur.mech  + (item.consumo_mech_m3  ?? 0),
        });
      });

      return Array.from(monthMap.entries())
        .sort(([a], [b]) => dayjs(a + "-01").diff(dayjs(b + "-01")))
        .map(([monthKey, { total, smart, mech }]) => ({
          date: monthKey,
          label: dayjs(monthKey + "-01").format("MMM YYYY"),
          totalFlow: total,
          smart,
          mech,
        }));
    }

    // --- MESES (1y) ---
    if (groupBy === "month") {
      return series.map((item) => ({
        date: item.fecha,
        label: dayjs(item.fecha).format("MMMM/YYYY"),
        totalFlow: item.consumo_m3,
        smart: item.consumo_smart_m3 ?? 0,
        mech:  item.consumo_mech_m3  ?? 0,
      }));
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
    <motion.div
      key={data.period ?? `${data.startDate}-${data.endDate}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Card className="border-0 shadow-sm bg-white dark:bg-card">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-foreground">
            Análisis de Consumo de Agua - {getPeriodLabel()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[21rem]">
            <ResponsiveContainer width="100%" height="100%" debounce={250}>
              <BarChart data={formatChartData(data.series)} barCategoryGap="20%" barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{
                    value: "Consumo (m³)",
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 12,
                    fill: "hsl(var(--muted-foreground))",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    fontSize: 12,
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "smart") return [`${value} m³`, "Inteligentes"];
                    if (name === "mech")  return [`${value} m³`, "Mecánicos"];
                    return [`${value} m³`, "Consumo"];
                  }}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                {hasSplit ? (
                  <>
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) =>
                        value === "smart" ? (
                          <span className="text-xs text-muted-foreground">Inteligentes</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Mecánicos</span>
                        )
                      }
                    />
                    <Bar
                      dataKey="smart"
                      fill={CHART_COLORS.smart}
                      radius={[4, 4, 0, 0]}
                      name="smart"
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="mech"
                      fill={CHART_COLORS.mech}
                      radius={[4, 4, 0, 0]}
                      name="mech"
                      isAnimationActive={false}
                    />
                  </>
                ) : (
                  <Bar
                    dataKey="totalFlow"
                    fill={meterStatus ? color : CHART_COLORS.total}
                    radius={[4, 4, 0, 0]}
                    name="Flujo Acumulado"
                    isAnimationActive={false}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
