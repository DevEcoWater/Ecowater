"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Chip from "../ui/chip";
import { MeterDataForTable } from "@/types/meters/meter-types";
import { normalizeStatus } from "@/utils/normalizeReadingStatusForChip";

export const readingsColumns: ColumnDef<MeterDataForTable>[] = [
  {
    accessorKey: "created_at",
    header: "Fecha y Hora",
    cell: ({ row }) => {
      const date = row.original.statuses.created_at;
      return new Date(date).toLocaleDateString("es-ES");
    },
  },
  {
    accessorKey: "cumulative_flow",
    header: "Flujo acumulado",
    cell: ({ row }) => {
      return row.original.cumulative_flow;
    },
  },
  {
    id: "instantaneous_flow",
    header: "Flujo instantáneo",
    cell: ({ row }) => {
      return row.original.instantaneous_flow;
    },
  },

  {
    accessorKey: "real_time_temperature",
    header: "Temperatura",
    cell: ({ row }) => {
      return row.original.real_time_temperature || "N/A";
    },
  },

  {
    accessorKey: "meter_status",
    header: "Estado del medidor",
    cell: ({ row }) => {
      const status = row.original.statuses.meter_status;
      return <Chip status={status} />;
    },
  },
];
