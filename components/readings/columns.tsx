"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Chip from "../ui/chip";
import { StatusReading } from "@/types/meters/meter-types";

export const readingsColumns: ColumnDef<StatusReading>[] = [
  {
    accessorKey: "timestamp",
    header: "Fecha y Hora",
    cell: ({ row }) => {
      const date = row.original.timestamp;
      return new Date(date).toLocaleString("es-ES", {
        timeZone: "UTC",
        dateStyle: "short",
        timeStyle: "medium",
      });
    },
  },
  {
    accessorKey: "cumulative_flow",
    header: "Flujo acumulado",
    cell: ({ row }) => {
      return row.original.cumulative_flow + " m3" || "N/A";
    },
  },
  {
    id: "instantaneous_flow",
    header: "Flujo instantáneo",
    cell: ({ row }) => {
      return row.original.instantaneous_flow + " m3" || "N/A";
    },
  },

  {
    accessorKey: "real_time_temperature",
    header: "Temperatura",
    cell: ({ row }) => {
      return row.original.real_time_temperature + " °C" || "N/A";
    },
  },

  {
    accessorKey: "meter_status",
    header: "Estado del medidor",
    cell: ({ row }) => {
      const status = row.original.statuses?.meter_status || "Desconocido";
      return <Chip status={status} />;
    },
  },
];
