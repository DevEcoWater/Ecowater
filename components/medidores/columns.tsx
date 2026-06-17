"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Chip from "../ui/chip";
import { MeterActions } from "./meter-actions";
import { MeterDataForTable } from "@/types/meters/meter-types";
import { formatDateTimeShortAR } from "@/lib/utils";
import { MeterTypeChip } from "@/components/ui/meter-type-chip";

export const meterColumns: ColumnDef<MeterDataForTable>[] = [
  {
    id: "medidor",
    header: "Medidor",
    cell: ({ row }) => {
      const m = row.original as any;
      const isMechanical = m.meter_type === "MECHANICAL";
      const code = m.dev_eui || m.device_name || "—";
      return (
        <div className="flex flex-col gap-1">
          <MeterTypeChip type={m.meter_type} className="w-fit whitespace-nowrap" />
          <span className="font-mono text-xs text-muted-foreground">{code}</span>
        </div>
      );
    },
  },
  {
    id: "cliente",
    header: "Cliente",
    cell: ({ row }) => row.original.userMeter?.userName || "Sin asignación",
  },
  {
    id: "address",
    header: "Dirección",
    cell: ({ row }) => {
      const m = row.original as any;
      const addr =
        m.meter_type === "MECHANICAL"
          ? m.street_address
          : m.userMeter?.shortData?.split(",")[0];
      return (
        <span className="text-sm truncate max-w-[200px] block">{addr || "—"}</span>
      );
    },
  },
  {
    accessorKey: "updated_at",
    header: "Actualización",
    cell: ({ row }) => formatDateTimeShortAR(row.original.updated_at),
  },
  {
    id: "estado",
    header: "Estado",
    cell: ({ row }) => <Chip status={row.original.status} />,
  },
  {
    id: "ultima_lectura",
    header: "Última lectura",
    cell: ({ row }) => {
      const m = row.original as any;
      // SMART: cumulative_flow is the meter's total accumulated volume.
      // MECHANICAL: operator enters the cumulative value as instantaneous_flow.
      const value =
        m.meter_type === "MECHANICAL"
          ? (m.lastReading?.value ?? null)
          : (m.lastReading?.cumulative ?? null);
      if (value === null) return <span className="text-muted-foreground">—</span>;
      return (
        <span className="font-mono text-sm">{value}</span>
      );
    },
  },
  {
    id: "actividad",
    header: "Actividad",
    cell: ({ row }) => {
      const m = row.original as any;
      const age = m.dataFreshness?.age ?? "—";
      const warning = m.dataFreshness?.warning ?? null;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-sm">{age}</span>
          {warning && (
            <span className="text-xs text-amber-600">{warning}</span>
          )}
        </div>
      );
    },
  },
  {
    id: "conectividad",
    header: "Conectividad",
    cell: ({ row }) => {
      const m = row.original as any;
      if (m.meter_type === "MECHANICAL") {
        return <span className="text-muted-foreground text-sm">—</span>;
      }
      const connStatus = m.connectivity?.status ?? "OFFLINE";
      const colorMap: Record<string, { bg: string; text: string }> = {
        ONLINE: { bg: "#dcfce7", text: "#166534" },
        STALE: { bg: "#fef9c3", text: "#854d0e" },
        OFFLINE: { bg: "#f3f4f6", text: "#6b7280" },
      };
      const colors = colorMap[connStatus] ?? colorMap.OFFLINE;
      const labels: Record<string, string> = {
        ONLINE: "En línea",
        STALE: "Intermitente",
        OFFLINE: "Sin señal",
      };
      return (
        <div
          className="flex justify-center items-center rounded-xl py-1 px-2.5 text-sm w-fit min-w-[90px]"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {labels[connStatus] ?? connStatus}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const m = row.original as any;
      const meterInfo = {
        meter_id: m.id,
        user_id: m.userMeter?.user_id,
        meter_type: m.meter_type ?? "SMART",
        device_name: m.device_name ?? "",
        street_address: m.street_address ?? "",
        dev_eui: m.dev_eui ?? "",
      };
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <MeterActions meter={meterInfo} />
        </div>
      );
    },
  },
];
