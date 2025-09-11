import React from "react";
import { AlertTriangle, Zap, Gauge, Clock } from "lucide-react";
import { UrgencyData } from "@/hooks/dashboard/use-urgencies";

type UrgencyItem =
  | UrgencyData["alerts"]["critical"][0]
  | UrgencyData["alerts"]["alarms"][0]
  | UrgencyData["alerts"]["inactive"][0];

interface UrgencyCardProps {
  urgency: UrgencyItem;
}

export function UrgencyCard({ urgency }: UrgencyCardProps) {
  const getUrgencyStyle = () => {
    switch (urgency.priority) {
      case "HIGH":
        return {
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          iconColor: "text-red-500",
          icon: AlertTriangle,
        };
      case "MEDIUM":
        return {
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          iconColor: "text-yellow-500",
          icon: Zap,
        };
      default:
        return {
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          iconColor: "text-gray-500",
          icon: Gauge,
        };
    }
  };

  const getUrgencyTitle = () => {
    switch (urgency.type) {
      case "CRITICAL_METER":
        return "Medidor Crítico";
      case "ALARM":
        return "Alarma Detectada";
      case "INACTIVE_METER":
        return "Medidor Inactivo";
      default:
        return "Urgencia";
    }
  };

  const getUrgencyDescription = () => {
    if (urgency.type === "CRITICAL_METER") {
      return `Medidor ${urgency.meter.device_name} con estado crítico`;
    } else if (urgency.type === "ALARM") {
      return `Alarma en medidor ${urgency.meter.device_name}`;
    } else if (urgency.type === "INACTIVE_METER") {
      return `Medidor ${urgency.meter.device_name} sin transmisión`;
    }
    return "Descripción no disponible";
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Desconocido";
    }
  };

  const style = getUrgencyStyle();
  const Icon = style.icon;

  return (
    <div
      className={`p-3 rounded-lg border ${style.bgColor} ${style.borderColor}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-white ${style.iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 text-sm mb-1">
            {getUrgencyTitle()}
          </h4>
          <p className="text-gray-600 text-xs mb-2">
            {getUrgencyDescription()}
          </p>
          {urgency.user && (
            <p className="text-gray-500 text-xs mb-2">
              Usuario: {urgency.user.name}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>
              {urgency.type === "INACTIVE_METER"
                ? urgency.lastActivity
                : formatTimestamp(
                    urgency.timestamp || new Date().toISOString()
                  )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
