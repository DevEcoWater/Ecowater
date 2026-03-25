import React from "react";
import { TriangleAlert, Clock } from "lucide-react";
import { useMeterDetailUrgencies } from "@/hooks/urgencies/use-urgencies";
import { MeterStatusBadge } from "@/components/ui/meter-status-badge";
import { formatDateTimeShortAR } from "@/lib/utils";

interface AlertComponentProps {
  meterId: string;
  meterType?: "SMART" | "MECHANICAL";
}

const AlertComponent = ({ meterId, meterType }: AlertComponentProps) => {
  const {
    data: urgencies,
    isLoading,
    error,
  } = useMeterDetailUrgencies(meterId);

  if (meterType === "MECHANICAL") {
    return (
      <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
        <p className="text-sm text-blue-800">
          Los medidores mecánicos no generan alertas automáticas. Las lecturas se registran manualmente por los operarios.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
        <TriangleAlert size={18} className="text-gray-500" />
        <p className="text-sm text-gray-600">Cargando alertas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 p-4 border border-red-200 rounded-lg bg-red-50">
        <TriangleAlert size={18} className="text-red-700" />
        <p className="text-sm text-red-800">Error al cargar las alertas.</p>
      </div>
    );
  }

  if (!urgencies) {
    return (
      <div className="flex items-center gap-2 p-4 border border-yellow-200 rounded-lg bg-yellow-50">
        <TriangleAlert size={18} className="text-yellow-700" />
        <p className="text-sm text-yellow-800">
          No fue posible encontrar información de las alertas.
        </p>
      </div>
    );
  }

  const allAlerts = [
    ...urgencies.alerts.critical,
    ...urgencies.alerts.high,
    ...urgencies.alerts.medium,
    ...urgencies.alerts.low,
    ...urgencies.alerts.inactive,
  ];

  if (allAlerts.length === 0) {
    return (
      <div className="p-4 border border-green-200 rounded-lg bg-green-50">
        <p className="text-sm text-green-800">No hay alertas activas.</p>
      </div>
    );
  }

  const getAlertStyle = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return {
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          textColor: "text-red-800",
          iconColor: "text-red-700",
        };
      case "HIGH":
        return {
          bgColor: "bg-orange-50",
          borderColor: "border-orange-200",
          textColor: "text-orange-800",
          iconColor: "text-orange-700",
        };
      case "MEDIUM":
        return {
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          textColor: "text-yellow-800",
          iconColor: "text-yellow-700",
        };
      default:
        return {
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          textColor: "text-gray-800",
          iconColor: "text-gray-700",
        };
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDateTimeShortAR(date);
    } catch {
      return "Desconocido";
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Estado de conectividad */}
      {allAlerts.length > 0 && allAlerts[0].connectivity && (
        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <div className="mb-2">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Estado de Conectividad
            </h4>
            <MeterStatusBadge
              connectivity={allAlerts[0].connectivity}
              meterStatus={allAlerts[0].meter?.status}
              operationalStatus={allAlerts[0].meter?.operational_status}
              showDetails={true}
              size="md"
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Alertas */}
      {allAlerts.map((alert, index) => {
        const style = getAlertStyle(alert.severity);
        return (
          <div
            key={`${alert.type}-${index}`}
            className={`flex items-start gap-3 p-4 border rounded-lg ${style.bgColor} ${style.borderColor}`}
          >
            <TriangleAlert size={18} className={`${style.iconColor} mt-0.5`} />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <p className={`text-sm font-medium ${style.textColor} mb-1`}>
                  {alert.message}
                </p>
                {alert.dataFreshness && !alert.dataFreshness.isRecent && (
                  <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                    {alert.dataFreshness.age}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock size={12} />
                <span>
                  {alert.reading?.timestamp
                    ? formatTimestamp(alert.reading.timestamp)
                    : alert.created_at
                    ? formatTimestamp(alert.created_at)
                    : "Sin fecha"}
                </span>
              </div>

              {alert.dataFreshness?.warning && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                  ⚠️ {alert.dataFreshness.warning}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AlertComponent;
