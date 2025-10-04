import React from "react";
import { Wifi, WifiOff, AlertCircle, Clock } from "lucide-react";

interface MeterStatusBadgeProps {
  connectivity: {
    status: "ONLINE" | "OFFLINE" | "STALE";
    lastSeen: string | null;
    signalQuality: "EXCELLENT" | "GOOD" | "POOR" | "UNKNOWN";
  };
  meterStatus?: string;
  operationalStatus?: string;
  showDetails?: boolean;
  size?: "sm" | "md" | "lg";
}

export function MeterStatusBadge({
  connectivity,
  meterStatus,
  operationalStatus,
  showDetails = false,
  size = "md",
}: MeterStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (connectivity.status) {
      case "ONLINE":
        return {
          icon: Wifi,
          color: "text-green-500",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          text: "Activo",
          description: "Última lectura < 24h",
        };
      case "STALE":
        return {
          icon: WifiOff,
          color: "text-yellow-500",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          text: "Inactivo",
          description: "Última lectura ≥ 24h",
        };
      case "OFFLINE":
        return {
          icon: WifiOff,
          color: "text-red-500",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          text: "Desconectado",
          description: "Sin lecturas registradas",
        };
      default:
        return {
          icon: AlertCircle,
          color: "text-gray-500",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          text: "Desconocido",
          description: "Estado no determinado",
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          container: "px-2 py-1 text-xs",
          icon: "w-3 h-3",
          text: "text-xs",
        };
      case "md":
        return {
          container: "px-3 py-1.5 text-sm",
          icon: "w-4 h-4",
          text: "text-sm",
        };
      case "lg":
        return {
          container: "px-4 py-2 text-base",
          icon: "w-5 h-5",
          text: "text-base",
        };
    }
  };

  const config = getStatusConfig();
  const sizeClasses = getSizeClasses();
  const Icon = config.icon;

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return "Nunca";

    try {
      const date = new Date(lastSeen);
      const now = new Date();
      const diffHours = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      );

      if (diffHours < 1) return "Hace menos de 1h";
      if (diffHours < 24) return `Hace ${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      return `Hace ${diffDays}d`;
    } catch {
      return "Desconocido";
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border ${config.bgColor} ${config.borderColor} ${sizeClasses.container}`}>
      <Icon className={`${config.icon} ${config.color}`} />
      <div className="flex flex-col">
        <span className={`font-medium ${config.color} ${sizeClasses.text}`}>
          {config.text}
        </span>
        {showDetails && (
          <div className="text-xs text-gray-600 space-y-1">
            <div>{config.description}</div>
            {connectivity.lastSeen && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatLastSeen(connectivity.lastSeen)}</span>
              </div>
            )}
            {meterStatus && (
              <div className="text-xs">
                Estado: <span className="font-medium">{meterStatus}</span>
              </div>
            )}
            {operationalStatus && (
              <div className="text-xs">
                Operacional:{" "}
                <span className="font-medium">{operationalStatus}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Componente simplificado para uso en listas
export function MeterStatusIndicator({
  connectivity,
  size = "sm",
}: Pick<MeterStatusBadgeProps, "connectivity" | "size">) {
  return (
    <MeterStatusBadge
      connectivity={connectivity}
      size={size}
      showDetails={false}
    />
  );
}
