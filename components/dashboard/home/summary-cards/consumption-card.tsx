import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Droplets } from "lucide-react";

interface ConsumptionCardProps {
  totalConsumption: number;
  period: string;
  color: string;
  backgroundColor: string;
}

export function ConsumptionCard({
  totalConsumption,
  period,
  color,
  backgroundColor,
}: ConsumptionCardProps) {
  return (
    <Card className="p-6 border-0 shadow-sm bg-white">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">
              Consumo Total ({period})
            </p>
            <p style={{ color: color }} className="text-3xl font-bold mt-2">
              {totalConsumption.toLocaleString()} m³
            </p>
          </div>
          <div
            style={{ backgroundColor: backgroundColor }}
            className="p-3 rounded-lg"
          >
            <Droplets
              style={{ color: color }}
              className="w-8 h-8 text-[${color}]"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
