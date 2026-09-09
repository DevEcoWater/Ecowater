"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, MapPin, Wrench, CheckCircle2 } from "lucide-react";
import { OperatorZone } from "@/types/operarios/operario-types";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  ACTIVE:   { label: "Activa",   className: "bg-green-100 text-green-700" },
  UPCOMING: { label: "Próxima",  className: "bg-blue-100 text-blue-700"  },
  INACTIVE: { label: "Inactiva", className: "bg-gray-100 text-gray-500"  },
};

export function ZoneCard({ zone }: { zone: OperatorZone }) {
  const router = useRouter();
  const statusInfo = STATUS_LABEL[zone.status] ?? STATUS_LABEL.ACTIVE;

  const hasAssignment = zone.assigned_count > 0;
  const allDone = hasAssignment && zone.read_count_today >= zone.assigned_count;
  const progressPct = hasAssignment
    ? Math.min(100, Math.round((zone.read_count_today / zone.assigned_count) * 100))
    : 0;

  return (
    <button
      onClick={() => router.push(`/portal/zonas/${zone.id}`)}
      className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-start gap-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      {/* Zone color dot */}
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: zone.color + "20" }}
      >
        <MapPin className="w-5 h-5" style={{ color: zone.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name + status */}
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-900 text-base truncate">{zone.name}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Meter counts */}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Wrench className="w-3 h-3" />
            {hasAssignment
              ? `${zone.assigned_count} asignados de ${zone.meter_count}`
              : `${zone.meter_count} en zona`}
          </span>
        </div>

        {/* Progress bar — only when the operator has assigned meters */}
        {hasAssignment && (
          <div className="mt-2.5">
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  allDone ? "bg-green-500" : "bg-blue-500"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-400">
                {zone.read_count_today} / {zone.assigned_count} leídos hoy
              </span>
              {allDone && (
                <span className="text-xs font-medium text-green-600 flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  Completo
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 mt-1" />
    </button>
  );
}
