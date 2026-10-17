import React from "react";
import { AlertTriangle, OctagonAlert, Clock, ArrowRight, User, Gauge } from "lucide-react";
import { Alert } from "@/hooks/urgencies/use-urgencies";
import { MeterStatusIndicator } from "@/components/ui/meter-status-badge";
import Link from "next/link";
import { cn, formatDateTimeShortAR } from "@/lib/utils";

interface UrgencyCardProps {
  urgency: Alert;
}

type UrgencyCategory = "error" | "alert";

// Misma regla que las pestañas: CRITICAL/HIGH = errores, el resto = alertas
export function getUrgencyCategory(severity: Alert["severity"]): UrgencyCategory {
  return severity === "CRITICAL" || severity === "HIGH" ? "error" : "alert";
}

const CATEGORY_STYLES: Record<
  UrgencyCategory,
  { label: string; icon: React.ElementType; accent: string; iconBox: string; badge: string }
> = {
  error: {
    label: "Error",
    icon: OctagonAlert,
    accent: "border-l-red-500",
    iconBox: "bg-red-500/10 text-red-500",
    badge: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  },
  alert: {
    label: "Alerta",
    icon: AlertTriangle,
    accent: "border-l-amber-400",
    iconBox: "bg-amber-400/15 text-amber-500",
    badge: "bg-amber-400/15 text-amber-700 dark:text-amber-300 border-amber-400/40",
  },
};

const SEVERITY_LABELS: Record<Alert["severity"], string> = {
  CRITICAL: "Crítico",
  HIGH: "Alto",
  MEDIUM: "Medio",
  LOW: "Bajo",
};

const URGENCY_TITLES: Record<string, string> = {
  CRITICAL_METER: "Medidor Crítico",
  VALVE_ISSUE: "Problema de Válvula",
  BATTERY_LOW: "Batería Baja",
  EMPTY_PIPE_ALARM: "Alarma de Tubería Vacía",
  REVERSE_FLOW_ALARM: "Alarma de Flujo Reverso",
  OVER_RANGE_ALARM: "Alarma de Rango Excedido",
  WATER_TEMP_ALARM: "Alarma de Temperatura",
  EE_ALARM: "Alarma EE",
  MAINTENANCE_NEEDED: "Mantenimiento Requerido",
  INACTIVE_METER: "Medidor Inactivo",
};

function formatTimestamp(timestamp?: string | null) {
  if (!timestamp) return "Sin fecha";
  try {
    return formatDateTimeShortAR(new Date(timestamp));
  } catch {
    return "Desconocido";
  }
}

export function UrgencyCard({ urgency }: UrgencyCardProps) {
  const category = getUrgencyCategory(urgency.severity);
  const style = CATEGORY_STYLES[category];
  const Icon = style.icon;

  const title = URGENCY_TITLES[urgency.type] ?? (urgency.message || "Urgencia");
  const description = urgency.message || `Medidor ${urgency.meter.device_name}`;

  return (
    <Link href={`/dashboard/medidores/${urgency.meter.id}`} className="block group">
      <div
        className={cn(
          "p-3 rounded-lg border border-l-4 bg-card hover:bg-muted/50 hover:shadow-md transition-all duration-200",
          style.accent
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg shrink-0", style.iconBox)}>
            <Icon className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            {/* Título + grado */}
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm text-foreground leading-tight">{title}</h4>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border",
                    style.badge
                  )}
                >
                  {style.label} · {SEVERITY_LABELS[urgency.severity]}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-blue-500 transition-colors" />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">{description}</p>

            {/* Datos del medidor y usuario */}
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 min-w-0">
                <Gauge className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {urgency.meter.device_name}
                  <span className="opacity-70"> · {urgency.meter.dev_eui}</span>
                </span>
              </div>
              <div className="flex items-center gap-1.5 min-w-0">
                <User className="w-3 h-3 shrink-0" />
                <span className="truncate">{urgency.user?.name ?? "Sin usuario asignado"}</span>
              </div>
            </div>

            {/* Fecha + conectividad */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{formatTimestamp(urgency.reading?.timestamp ?? urgency.created_at)}</span>
              </div>
              {urgency.connectivity && (
                <MeterStatusIndicator connectivity={urgency.connectivity} size="sm" />
              )}
            </div>

            {urgency.dataFreshness && !urgency.dataFreshness.isRecent && urgency.dataFreshness.warning && (
              <div className="p-2 rounded border border-amber-400/40 bg-amber-400/10 text-xs text-amber-700 dark:text-amber-300">
                {urgency.dataFreshness.warning}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
