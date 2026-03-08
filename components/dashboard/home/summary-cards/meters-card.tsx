import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Gauge } from "lucide-react";

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
    <Card className="p-6 border-0 shadow-sm bg-white">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">
              Medidores en línea
            </p>
            <p style={{ color }} className="text-3xl font-bold mt-2">
              {onlineMeters} / {totalMeters}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-500">{onlinePercentage}% en línea</p>
              <span
                className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                style={{ color, backgroundColor: bg }}
              >
                {label}
              </span>
            </div>
          </div>
          <div style={{ backgroundColor: bg }} className="p-3 rounded-lg">
            <Gauge style={{ color }} className="w-8 h-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
