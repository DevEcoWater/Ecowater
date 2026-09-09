"use client";

import { MeterDataForTable } from "@/types/meters/meter-types";
import { MapPin, User2 } from "lucide-react";
import { MeterTypeChip } from "@/components/ui/meter-type-chip";
import Chip from "@/components/ui/chip";
import { MeterActions } from "./meter-actions";
import { formatDateTimeShortAR } from "@/lib/utils";
import { formatReadingAge } from "@/utils/timestampConverter";
import { MeterStatus } from "@prisma/client";

interface MeterCardProps {
  meter: MeterDataForTable;
  onClick: () => void;
}

export function MeterCard({ meter, onClick }: MeterCardProps) {
  const m = meter as any;
  const isMechanical = m.meter_type === "MECHANICAL";
  const code = m.dev_eui || m.device_name || "—";
  const address = isMechanical
    ? m.street_address
    : m.userMeter?.shortData?.split(",")[0];

  const meterInfo = {
    meter_id: m.id,
    user_id: m.userMeter?.user_id,
    meter_type: m.meter_type ?? "SMART",
    device_name: m.device_name ?? "",
    street_address: m.street_address ?? "",
    dev_eui: m.dev_eui ?? "",
  };

  return (
    <div
      onClick={onClick}
      className="bg-card rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
    >
      {/* Header: type badge + code + actions menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <MeterTypeChip type={m.meter_type} className="whitespace-nowrap shrink-0" />
          <span className="font-mono text-xs text-muted-foreground truncate">{code}</span>
        </div>
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <MeterActions meter={meterInfo} />
        </div>
      </div>

      {/* Body: client + address */}
      <div className="mt-3 space-y-1.5">
        {m.userMeter?.userName ? (
          <div className="flex items-center gap-1.5 text-sm">
            <User2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{m.userMeter.userName}</span>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Sin asignación</div>
        )}
        {address && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{address}</span>
          </div>
        )}
      </div>

      {/* Footer: status + last update */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {isMechanical ? (
          <div
            className="flex justify-center items-center rounded-xl py-1 px-2.5 text-sm min-w-[100px] w-fit"
            style={{ backgroundColor: "#ccfbf1", color: "#0f766e" }}
          >
            Manual
          </div>
        ) : (
          <Chip status={meter.status as MeterStatus} />
        )}
        <span className="text-xs text-muted-foreground">
          {formatDateTimeShortAR(meter.updated_at)}
        </span>
      </div>

      {/* Activity row */}
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          {formatReadingAge(m.lastReading?.timestamp)}
        </span>
        {m.dataFreshness?.warning && (
          <span className="text-xs text-amber-600">{m.dataFreshness.warning}</span>
        )}
      </div>
    </div>
  );
}
