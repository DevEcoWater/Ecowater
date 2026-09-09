import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Cpu, Droplets, TrendingDown, TrendingUp, Wrench } from "lucide-react";
import { getStatusColor } from "@/utils/getStatusColor";
import Link from "next/link";

interface ConsumptionCardProps {
  totalConsumption: number;
  period: string;
  previousTotal?: number;
  smartTotal?: number;
  mechTotal?: number;
}

export function ConsumptionCard({
  totalConsumption,
  period,
  previousTotal,
  smartTotal = 0,
  mechTotal = 0,
}: ConsumptionCardProps) {
  const { color, backgroundColor } = getStatusColor("DEFAULT");

  const changePercent =
    previousTotal != null && previousTotal > 0
      ? ((totalConsumption - previousTotal) / previousTotal) * 100
      : null;

  const isLess = changePercent !== null && changePercent < 0;
  const hasSplit = smartTotal > 0 || mechTotal > 0;
  const splitTotal = smartTotal + mechTotal;
  const smartPct = splitTotal > 0 ? (smartTotal / splitTotal) * 100 : 0;
  const mechPct  = splitTotal > 0 ? (mechTotal  / splitTotal) * 100 : 0;

  return (
    <Link href="/dashboard/medidores" className="h-full block">
      <Card className="p-6 border-0 shadow-sm bg-white dark:bg-card cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-l-4 border-l-blue-500 h-full">
        <CardContent className="p-0 h-full flex flex-col justify-center gap-3">
          {/* ── Número principal ── */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                Consumo Total ({period})
              </p>
              <p style={{ color: color }} className="text-3xl font-bold mt-2">
                {totalConsumption.toLocaleString()} m³
              </p>
              {changePercent !== null && (
                <div className="flex items-center gap-1 mt-1">
                  {isLess ? (
                    <TrendingDown className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                  )}
                  <span
                    className="text-xs font-medium"
                    style={{ color: isLess ? "#16a34a" : "#d97706" }}
                  >
                    {isLess ? "" : "+"}
                    {changePercent.toFixed(1)}% vs período anterior
                  </span>
                </div>
              )}
            </div>
            <div style={{ backgroundColor }} className="p-3 rounded-lg shrink-0">
              <Droplets style={{ color }} className="w-8 h-8" />
            </div>
          </div>

          {/* ── Desglose smart / mecánico ── */}
          {hasSplit && (
            <div className="space-y-2">
              {/* Barra segmentada */}
              <div className="h-1.5 bg-gray-100 dark:bg-muted rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${smartPct}%` }}
                />
                <div
                  className="h-full bg-amber-400 transition-all duration-500"
                  style={{ width: `${mechPct}%` }}
                />
              </div>
              {/* Labels */}
              <div className="flex items-center justify-between gap-2">
                {smartTotal > 0 && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="p-1 rounded bg-blue-100 shrink-0">
                      <Cpu className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
                      {smartTotal.toLocaleString()} m³
                    </span>
                  </div>
                )}
                {mechTotal > 0 && (
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="p-1 rounded bg-amber-100 shrink-0">
                      <Wrench className="w-3 h-3 text-amber-600" />
                    </div>
                    <span className="text-xs text-muted-foreground truncate">
                      {mechTotal.toLocaleString()} m³
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
