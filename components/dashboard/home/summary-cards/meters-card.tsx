import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Gauge } from "lucide-react";

interface MetersCardProps {
  totalMeters: number;
  onlineMeters: number;
}

export function MetersCard({ totalMeters, onlineMeters }: MetersCardProps) {
  const offlineMeters = totalMeters - onlineMeters;
  const onlinePercentage =
    totalMeters > 0 ? Math.round((onlineMeters / totalMeters) * 100) : 0;

  return (
    <Card className="p-6 border-0 shadow-sm bg-white">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">
              Medidores en línea
            </p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {onlineMeters} / {totalMeters}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {onlinePercentage}% en línea
            </p>
          </div>
          <div className="p-3 bg-green-100 rounded-lg">
            <Gauge className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
