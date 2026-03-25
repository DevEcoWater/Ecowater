"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Chip from "../ui/chip";
import { MeterActions } from "./meter-actions";
import { MeterDataForTable } from "@/types/meters/meter-types";
import { formatDateAR, formatDateTimeShortAR } from "@/lib/utils";
import { MeterStatus, OperationalStatus } from "@prisma/client";
import { Cpu, Wrench } from "lucide-react";

const OP_TO_METER_STATUS: Record<OperationalStatus, MeterStatus> = {
  OPERATIONAL: "ACTIVE",
  ERROR: "FAULTY",
  NEEDS_MAINTENANCE: "MAINTENANCE",
};

export const meterColumns: ColumnDef<MeterDataForTable>[] = [
  {
    id: "tipo",
    header: "Tipo",
    cell: ({ row }) => {
      const type = (row.original as any).meter_type;
      return type === "MECHANICAL" ? (
        <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 whitespace-nowrap">
          <Wrench className="w-3 h-3" /> Mecánico
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 whitespace-nowrap">
          <Cpu className="w-3 h-3" /> Inteligente
        </span>
      );
    },
  },
  {
    id: "codigo",
    header: "Código / ID",
    cell: ({ row }) => {
      const m = row.original as any;
      const value = m.dev_eui || "—";
      return <span className="font-mono text-xs">{value}</span>;
    },
  },
  {
    accessorKey: "created_at",
    header: "Fecha de registro",
    cell: ({ row }) => {
      const date = row.original.created_at;
      return formatDateAR(date);
    },
  },
  {
    accessorKey: "updated_at",
    header: "Última actualización",
    cell: ({ row }) => {
      const date = row.original.updated_at;
      return formatDateTimeShortAR(date);
    },
  },
  {
    id: "address",
    header: "Dirección",
    cell: ({ row }) => {
      const m = row.original as any;
      if (m.meter_type === "MECHANICAL") {
        return <span className="text-sm">{m.street_address || "—"}</span>;
      }
      const shortData = row.original.userMeter?.shortData?.split(",")[0];
      return shortData || "Sin dirección";
    },
  },
  {
    accessorKey: "userName",
    header: "Cliente",
    cell: ({ row }) => {
      return row.original.userMeter?.userName || "Sin asignación";
    },
  },
  {
    accessorKey: "status",
    header: "Conectividad",
    cell: ({ row }) => {
      const m = row.original as any;
      if (m.meter_type === "MECHANICAL") {
        return (
          <div
            className="flex justify-center items-center rounded-xl py-1 px-2.5 text-sm min-w-[100px] w-fit"
            style={{ backgroundColor: "#ccfbf1", color: "#0f766e" }}
          >
            Manual
          </div>
        );
      }
      return <Chip status={row.original.status} />;
    },
  },
  {
    accessorKey: "operational_status",
    header: "Estado operacional",
    cell: ({ row }) => {
      const m = row.original as any;
      if (m.meter_type === "MECHANICAL") {
        return <span className="text-xs text-muted-foreground">—</span>;
      }
      const op = row.original.operational_status as OperationalStatus;
      const meterStatus = OP_TO_METER_STATUS[op] ?? "ACTIVE";
      return <Chip status={meterStatus} />;
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
