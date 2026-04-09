import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Gauge } from "lucide-react";
import Link from "next/link";

interface MetersCardProps {
  totalMeters: number;
  onlineMeters: number;
}

function getNetworkHealth(pct: number) {
  if (pct >= 80) return { color: "#16a34a", bg: "#dcfce7", label: "Buena" };
  if (pct >= 50) return { color: "#d97706", bg: "#fef3c7", label: "Regular" };
  return { color: "#dc2626", bg: "#fee2e2", label: "Crítica" };
}

export function MetersCard({ totalMeters, onlineMeters }: MetersCardProps) {
  const onlinePercentage =
    totalMeters > 0 ? Math.round((onlineMeters / totalMeters) * 100) : 0;

  const { color, bg, label } = getNetworkHealth(onlinePercentage);

  return (
    <Link href="/dashboard/medidores" className="h-full block">
      <Card className="p-6 border-0 shadow-sm bg-white dark:bg-card cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-l-4 border-l-green-500 h-full">
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                Medidores en línea
              </p>
              <p style={{ color }} className="text-3xl font-bold mt-2">
                {onlineMeters} / {totalMeters}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${onlinePercentage}%`, backgroundColor: color }}
                  />
                </div>
                <span
                  className="text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0"
                  style={{ color, backgroundColor: bg }}
                >
                  {label}
                </span>
              </div>
            </div>
            <div style={{ backgroundColor: bg }} className="p-3 rounded-lg ml-4">
              <Gauge style={{ color }} className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
