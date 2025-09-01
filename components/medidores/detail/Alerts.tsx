import React from "react";
import {
  TriangleAlert,
  Thermometer,
  Battery,
  RotateCcw,
  Wrench,
} from "lucide-react";

const AlertComponent = ({ readingData }) => {
  if (!readingData || !readingData.statuses) {
    return (
      <div className="flex items-center gap-2 p-4 border border-yellow-200 rounded-lg bg-yellow-50">
        <TriangleAlert size={18} className="text-yellow-700" />
        <p className="text-sm text-yellow-800">
          No fue posible encontrar información de las alertas.
        </p>
      </div>
    );
  }

  const status = readingData.statuses;

  const valveLabels: Record<string, string> = {
    open: "Abierta",
    closed: "Cerrada",
    abnormal: "Anómala",
    unknown: "Desconocida",
  };

  const batteryLabels: Record<string, string> = {
    normal: "Normal",
    low: "Batería baja",
  };

  const possibleAlerts = [
    {
      condition: status.water_temp_alarm,
      message: `Temperatura del agua: ${readingData.real_time_temperature}`,
      icon: <Thermometer size={15} />,
      error: false,
    },
    {
      condition:
        status.battery_status === "low" || status.battery_voltage !== "normal",
      message: `Problema con la batería: ${
        batteryLabels[status.battery_voltage] || "Ver Batería"
      }`,
      icon: <Battery size={15} />,
      error: false,
    },
    {
      condition: parseFloat(readingData.reverse_flow) > 0.1,
      message: `Flujo reverso detectado: ${readingData.reverse_flow}`,
      icon: <RotateCcw size={15} />,
      error: false,
    },
    {
      condition:
        status.meter_status === "MAINTENANCE" ||
        status.operational_status === "NEEDS_MAINTENANCE",
      message: `Mantenimiento requerido`,
      icon: <Wrench size={15} />,
      error: false,
    },
    {
      condition: status.valve_status !== "open",
      message: `Estado de la válvula: ${
        valveLabels[status.valve_status] ?? "Desconocida"
      }`,
      icon: <TriangleAlert size={15} />,
      error: false,
    },
    {
      condition: readingData.alarm_status && readingData.alarm_status !== "00",
      message: `Alarma de estado: ${readingData.alarm_status}`,
      icon: <TriangleAlert size={15} />,
      error: false,
    },
    {
      condition: readingData.error_code !== null,
      message: `Código de error: ${readingData.error_code}`,
      icon: <TriangleAlert size={15} />,
      error: false,
    },
    {
      condition: status.ee_alarm,
      message: `Error Circuito Eléctrico`,
      icon: <TriangleAlert size={15} />,
      error: true,
    },
    {
      condition: status.empty_type_alarm,
      message: `Alarma de tubería vacía`,
      icon: <TriangleAlert size={15} />,
      error: false,
    },
    {
      condition: status.over_range_alarm,
      message: `Alarma de rango activada`,
      icon: <TriangleAlert size={15} />,
      error: false,
    },
    {
      condition: status.reverse_flow_alarm,
      message: `Error Flujo Invertido`,
      icon: <TriangleAlert size={15} />,
      error: true,
    },
  ];

  const activeAlerts = possibleAlerts.filter((alert) => alert.condition);

  if (activeAlerts.length === 0) {
    return (
      <div className="p-4 border border-green-200 rounded-lg bg-green-50">
        <p className="text-sm text-green-800">No hay alarmas activas.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {activeAlerts.map((alert, index) => (
        <div
          key={index}
          className={`flex items-center justify-start gap-2 p-4 border ${
            alert.error
              ? "border-red-200 rounded-lg bg-red-50"
              : "border-yellow-200 rounded-lg bg-yellow-50"
          } `}
        >
          {alert.icon}
          <p
            className={`text-sm ${
              alert.error ? "text-red-800" : "text-yellow-800"
            } `}
          >
            {alert.message}
          </p>
        </div>
      ))}
    </div>
  );
};

export default AlertComponent;
