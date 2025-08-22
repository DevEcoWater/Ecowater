import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TriangleAlert } from "lucide-react";

interface AlertsCardProps {
  activeAlerts: number;
}

export function AlertsCard({ activeAlerts }: AlertsCardProps) {
  const getAlertLevel = (count: number) => {
    if (count === 0) return "text-green-600 bg-green-100";
    if (count < 5) return "text-yellow-600 bg-yellow-100";
    return "text-orange-600 bg-orange-100";
  };

  const getAlertText = (count: number) => {
    if (count === 0) return "Sin alertas";
    if (count < 5) return "Pocas alertas";
    return "Muchas alertas";
  };

  return (
    <Card className="p-6 border-0 shadow-sm bg-white">
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Alertas Activas</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {activeAlerts}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {getAlertText(activeAlerts)}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${getAlertLevel(activeAlerts)}`}>
            <TriangleAlert className="w-8 h-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
