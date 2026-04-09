import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Droplets, TrendingDown, TrendingUp } from "lucide-react";
import { getStatusColor } from "@/utils/getStatusColor";
import Link from "next/link";

interface ConsumptionCardProps {
  totalConsumption: number;
  period: string;
  previousTotal?: number;
}

export function ConsumptionCard({
  totalConsumption,
  period,
  previousTotal,
}: ConsumptionCardProps) {
  const { color, backgroundColor } = getStatusColor("DEFAULT");

  const changePercent =
    previousTotal != null && previousTotal > 0
      ? ((totalConsumption - previousTotal) / previousTotal) * 100
      : null;

  const isLess = changePercent !== null && changePercent < 0;

  return (
    <Link href="/dashboard/medidores" className="h-full block">
      <Card className="p-6 border-0 shadow-sm bg-white dark:bg-card cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-l-4 border-l-blue-500 h-full">
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
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
            <div
              style={{ backgroundColor: backgroundColor }}
              className="p-3 rounded-lg"
            >
              <Droplets style={{ color: color }} className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
