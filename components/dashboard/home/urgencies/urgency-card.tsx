import React from "react";
import { AlertTriangle, Zap, Gauge, Clock, ArrowRight } from "lucide-react";
import { Alert } from "@/hooks/urgencies/use-urgencies";
import { MeterStatusIndicator } from "@/components/ui/meter-status-badge";
import Link from "next/link";
import { formatDateTimeShortAR } from "@/lib/utils";
interface UrgencyCardProps {
  urgency: Alert;
}

export function UrgencyCard({ urgency }: UrgencyCardProps) {
  const getUrgencyStyle = () => {
    switch (urgency.severity) {
      case "CRITICAL":
        return {
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          iconColor: "text-red-500",
          icon: AlertTriangle,
        };
      case "HIGH":
        return {
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          iconColor: "text-orange-500",
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
      case "VALVE_ISSUE":
        return "Problema de Válvula";
      case "BATTERY_LOW":
        return "Batería Baja";
      case "EMPTY_PIPE_ALARM":
        return "Alarma de Tubería Vacía";
      case "REVERSE_FLOW_ALARM":
        return "Alarma de Flujo Reverso";
      case "OVER_RANGE_ALARM":
        return "Alarma de Rango Excedido";
      case "WATER_TEMP_ALARM":
        return "Alarma de Temperatura";
      case "EE_ALARM":
        return "Alarma EE";
      case "MAINTENANCE_NEEDED":
        return "Mantenimiento Requerido";
      case "INACTIVE_METER":
        return "Medidor Inactivo";
      default:
        return urgency.message || "Urgencia";
    }
  };

  const getUrgencyDescription = () => {
    return urgency.message || `Medidor ${urgency.meter.device_name}`;
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDateTimeShortAR(date);
    } catch {
      return "Desconocido";
    }
  };

  const style = getUrgencyStyle();
  const Icon = style.icon;

  return (
    <Link href={`dashboard/medidores/${urgency.meter.id}`}>
      <div
        className={`p-3 rounded-lg border ${style.bgColor} ${style.borderColor} hover:shadow-md transition-shadow duration-200 group cursor-pointer`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg bg-white ${style.iconColor}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 text-sm mb-1">
                {getUrgencyTitle()}
              </h4>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors duration-200" />
            </div>
            <p className="text-gray-600 text-xs mb-2">
              {getUrgencyDescription()}
            </p>
            <div className="text-gray-500 text-xs mb-2">
              Medidor: {urgency.meter.device_name}
              <span className="text-gray-500 text-xs mb-2">
                {" "}
                | {urgency.meter.dev_eui}
              </span>
            </div>
            {urgency.user && (
              <p className="text-gray-500 text-xs mb-2">
                Usuario: {urgency.user.name}
              </p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>
                  {urgency.reading?.timestamp
                    ? formatTimestamp(urgency.reading.timestamp)
                    : urgency.created_at
                    ? formatTimestamp(urgency.created_at)
                    : "Sin fecha"}
                </span>
              </div>

              {/* Indicador de conectividad */}
              {urgency.connectivity && (
                <MeterStatusIndicator
                  connectivity={urgency.connectivity}
                  size="sm"
                />
              )}
            </div>

            {/* Indicador de frescura de datos */}
            {urgency.dataFreshness && !urgency.dataFreshness.isRecent && (
              <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-800">
                ⚠️ {urgency.dataFreshness.warning}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
