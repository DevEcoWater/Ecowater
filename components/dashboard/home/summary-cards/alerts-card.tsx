import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TriangleAlert } from "lucide-react";
import { getStatusColor } from "@/utils/getStatusColor";

interface AlertsCardProps {
  activeAlerts: number;
  onShowAlarms?: () => void;
}

export function AlertsCard({ activeAlerts, onShowAlarms }: AlertsCardProps) {
  const getAlertText = (count: number) => {
    if (count === 0) return "Sin alertas";
    if (count < 5) return "Pocas alertas";
    return "Muchas alertas";
  };

  const { color, backgroundColor } = getStatusColor("PENDING");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onShowAlarms}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onShowAlarms?.()}
      className="h-full block"
    >
      <Card className="p-6 border-0 shadow-sm bg-white dark:bg-card cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 border-l-4 border-l-amber-500 h-full">
        <CardContent className="p-0 h-full flex flex-col justify-center gap-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">Alertas Activas</p>
              <p style={{ color: color }} className="text-3xl font-bold mt-2">
                {activeAlerts}
              </p>
              <p className="text-sm text-gray-500 dark:text-muted-foreground mt-1">
                {getAlertText(activeAlerts)}
              </p>
            </div>
            <div
              style={{ backgroundColor: backgroundColor }}
              className="p-3 rounded-lg shrink-0"
            >
              <TriangleAlert style={{ color: color }} className="w-8 h-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
