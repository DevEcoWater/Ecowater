"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface RankingItem {
  id: string;
  name: string;
  value: number;
  href: string;
  /** Color propio (p. ej. el de la zona). Si falta, se usa la paleta por posición. */
  color?: string;
  /** Texto extra junto al % del total */
  detail?: string;
}

interface ConsumptionRankingChartProps {
  title: string;
  period: string;
  items: RankingItem[];
  /** Plural para la fila "Otros (n …)" */
  itemNoun: string;
  viewAll: { href: string; label: string };
  footerNote?: string;
}

const COLORS = ["#3b82f6", "#06b6d4", "#8b5cf6", "#f59e0b", "#10b981"];
const OTHERS_COLOR = "#94a3b8";
const RADIAN = Math.PI / 180;

function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (percent < 0.08) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export const ConsumptionRankingChart = React.memo(function ConsumptionRankingChart({
  title,
  period,
  items,
  itemNoun,
  viewAll,
  footerNote,
}: ConsumptionRankingChartProps) {
  if (items.length === 0) {
    return (
      <Card className="border-0 shadow-sm bg-white dark:bg-card h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-foreground">
            {title} — {period}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-52">
          <p className="text-sm text-gray-400 dark:text-muted-foreground">Sin datos para el período seleccionado</p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...items].sort((a, b) => b.value - a.value);
  const top5 = sorted.slice(0, 5).map((item, i) => ({ ...item, color: item.color ?? COLORS[i] }));
  const rest = sorted.slice(5);
  const otrosTotal = rest.reduce((sum, item) => sum + item.value, 0);

  const chartData = [
    ...top5.map((item) => ({ name: item.name, value: item.value, color: item.color })),
    ...(otrosTotal > 0 ? [{ name: "Otros", value: otrosTotal, color: OTHERS_COLOR }] : []),
  ];

  const total = chartData.reduce((sum, d) => sum + d.value, 0);
  const maxValue = top5[0]?.value ?? 1;

  return (
    <motion.div
      key={period}
      className="h-full"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <Card className="border-0 shadow-sm bg-white dark:bg-card h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-foreground">
            {title} — {period}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            {/* Donut chart */}
            <div className="h-52 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%" debounce={250}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={82}
                    paddingAngle={2}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomLabel}
                    isAnimationActive={false}
                  >
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      fontSize: 12,
                      backgroundColor: "hsl(var(--popover))",
                      borderColor: "hsl(var(--border))",
                      color: "hsl(var(--popover-foreground))",
                    }}
                    formatter={(value: number) => [
                      `${value.toLocaleString()} m³ (${total > 0 ? ((value / total) * 100).toFixed(1) : 0}%)`,
                      "Consumo",
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Ranking lateral */}
            <div className="flex-1 flex flex-col gap-2.5 min-w-0">
              {top5.map((item, i) => {
                const pct = total > 0 ? (item.value / total) * 100 : 0;
                const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                return (
                  <Link key={item.id} href={item.href} className="group">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Posición + color */}
                      <span
                        className="text-xs font-bold tabular-nums w-4 shrink-0"
                        style={{ color: item.color }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        {/* Nombre + valor */}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-medium text-foreground truncate group-hover:text-blue-500 transition-colors">
                            {item.name}
                          </span>
                          <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                            {item.value.toLocaleString()} m³
                          </span>
                        </div>
                        {/* Barra */}
                        <div className="h-1.5 bg-gray-100 dark:bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${barWidth}%` }}
                            transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                          />
                        </div>
                        {/* % del total */}
                        <span className="text-[10px] text-muted-foreground">
                          {pct.toFixed(1)}% del total{item.detail ? ` · ${item.detail}` : ""}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {otrosTotal > 0 && (
                <div className="flex items-center gap-2 pt-1 border-t border-border/50">
                  <span className="text-xs text-muted-foreground w-4">·</span>
                  <span className="text-xs text-muted-foreground flex-1">Otros ({rest.length} {itemNoun})</span>
                  <span className="text-xs tabular-nums text-muted-foreground">{otrosTotal.toLocaleString()} m³</span>
                </div>
              )}

              <Link
                href={viewAll.href}
                className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors pt-1 mt-auto"
              >
                {viewAll.label} <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between gap-2 mt-3 text-xs text-muted-foreground">
            <span>{footerNote}</span>
            <span>
              Total período: <span className="font-semibold text-foreground">{total.toLocaleString()} m³</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
