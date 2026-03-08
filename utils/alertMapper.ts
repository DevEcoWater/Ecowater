import {
  MeterStatus as PrismaMeterStatus,
  OperationalStatus,
} from "@prisma/client";

export type AlertType =
  | "CRITICAL_METER"
  | "VALVE_ISSUE"
  | "BATTERY_LOW"
  | "EMPTY_PIPE_ALARM"
  | "REVERSE_FLOW_ALARM"
  | "OVER_RANGE_ALARM"
  | "WATER_TEMP_ALARM"
  | "EE_ALARM"
  | "INACTIVE_METER"
  | "MAINTENANCE_NEEDED";

export type AlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type Alert = {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  field: string;
  value: any;
};

export type StatusData = {
  id: string;
  reading_id: string;
  valve_status: string;
  battery_voltage: string;
  battery_status: boolean;
  empty_pipe_alarm: boolean;
  reverse_flow_alarm: boolean;
  over_range_alarm: boolean;
  water_temp_alarm: boolean;
  ee_alarm: boolean;
  meter_status: PrismaMeterStatus;
  operational_status: OperationalStatus;
  created_at: string | Date;
};

/**
 * Convierte un Status en múltiples alertas categorizadas
 */
export function mapStatusToAlerts(status: StatusData): Alert[] {
  const alerts: Alert[] = [];

  // 1. HIGH: Problemas de válvula
  if (status.valve_status === "abnormal") {
    alerts.push({
      type: "VALVE_ISSUE",
      severity: "HIGH",
      message: "Estado de válvula anormal",
      field: "valve_status",
      value: status.valve_status,
    });
  } else if (status.valve_status === "closed") {
    alerts.push({
      type: "VALVE_ISSUE",
      severity: "MEDIUM",
      message: "Valvula cerrada",
      field: "valve_status",
      value: status.valve_status,
    });
  }

  // 3. MEDIUM: Batería baja
  if (status.battery_voltage === "low" || status.battery_status) {
    alerts.push({
      type: "BATTERY_LOW",
      severity: "MEDIUM",
      message: "Bateria baja o con problemas",
      field: "battery_status",
      value: { voltage: status.battery_voltage, status: status.battery_status },
    });
  }

  // 4. CRITICAL: Alarmas críticas
  if (status.empty_pipe_alarm) {
    alerts.push({
      type: "EMPTY_PIPE_ALARM",
      severity: "CRITICAL",
      message: "Alarma de tubería vacía",
      field: "empty_pipe_alarm",
      value: status.empty_pipe_alarm,
    });
  }

  if (status.reverse_flow_alarm) {
    alerts.push({
      type: "REVERSE_FLOW_ALARM",
      severity: "CRITICAL",
      message: "Alarma de flujo reverso",
      field: "reverse_flow_alarm",
      value: status.reverse_flow_alarm,
    });
  }

  // 5. HIGH: Alarmas de rango y temperatura
  if (status.over_range_alarm) {
    alerts.push({
      type: "OVER_RANGE_ALARM",
      severity: "HIGH",
      message: "Alarma de rango excedido",
      field: "over_range_alarm",
      value: status.over_range_alarm,
    });
  }

  if (status.water_temp_alarm) {
    alerts.push({
      type: "WATER_TEMP_ALARM",
      severity: "HIGH",
      message: "Alarma de temperatura del agua",
      field: "water_temp_alarm",
      value: status.water_temp_alarm,
    });
  }

  // 6. MEDIUM: Alarma de EE
  if (status.ee_alarm) {
    alerts.push({
      type: "EE_ALARM",
      severity: "MEDIUM",
      message: "Alarma de EE",
      field: "ee_alarm",
      value: status.ee_alarm,
    });
  }

  return alerts;
}

/**
 * Agrupa alertas por severidad para el JSON final
 */
export function groupAlertsBySeverity(alerts: Alert[]) {
  return {
    critical: alerts.filter((a) => a.severity === "CRITICAL"),
    high: alerts.filter((a) => a.severity === "HIGH"),
    medium: alerts.filter((a) => a.severity === "MEDIUM"),
    low: alerts.filter((a) => a.severity === "LOW"),
    total: alerts.length,
  };
}

/**
 * Agrupa alertas por tipo para análisis
 */
export function groupAlertsByType(alerts: Alert[]) {
  const grouped: Record<AlertType, Alert[]> = {} as any;

  alerts.forEach((alert) => {
    if (!grouped[alert.type]) {
      grouped[alert.type] = [];
    }
    grouped[alert.type].push(alert);
  });

  return grouped;
}
