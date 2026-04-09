"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Building2, Users } from "lucide-react";
import { OperatorZone } from "@/types/operarios/operario-types";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Activo", className: "bg-green-100 text-green-700" },
  UPCOMING: { label: "Próximo", className: "bg-blue-100 text-blue-700" },
  INACTIVE: { label: "Inactivo", className: "bg-gray-100 text-gray-500" },
};

export function ZoneCard({ zone }: { zone: OperatorZone }) {
  const router = useRouter();
  const statusInfo = STATUS_LABEL[zone.status] ?? STATUS_LABEL.ACTIVE;

  return (
    <button
      onClick={() => router.push(`/portal/zonas/${zone.id}`)}
      className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-4 min-h-[80px] flex items-center gap-4 text-left hover:bg-gray-50 active:bg-gray-100 transition-colors"
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: zone.color + "20" }}
      >
        <Building2 className="w-6 h-6" style={{ color: zone.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-base truncate">{zone.name}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            Medidores: {zone.meter_count}
          </span>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Users className="w-3 h-3" />
            Operarios: {zone.operator_count}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        </div>
      </div>

      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
    </button>
  );
}
