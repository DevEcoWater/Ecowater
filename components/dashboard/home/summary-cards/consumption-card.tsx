import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Droplets } from "lucide-react";

interface ConsumptionCardProps {
  totalConsumption: number;
  period: string;
}

export function ConsumptionCard({
  totalConsumption,
  period,
}: ConsumptionCardProps) {
  return (
    <Card className="p-6 border-0 shadow-sm bg-white">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">
              Consumo Total ({period})
            </p>
            <p className="text-3xl font-bold text-blue-600 mt-2">
              {totalConsumption.toLocaleString()} m³
            </p>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <Droplets className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
