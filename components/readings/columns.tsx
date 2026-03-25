"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Chip from "../ui/chip";
import { StatusReading } from "@/types/meters/meter-types";
import { formatDateAR, formatDateTimeAR } from "@/lib/utils";

export function getReadingColumns(
  meterType: "SMART" | "MECHANICAL" = "SMART"
): ColumnDef<StatusReading>[] {
  if (meterType === "MECHANICAL") {
    return [
      {
        accessorKey: "timestamp",
        header: "Fecha",
        cell: ({ row }) => {
          return formatDateAR(row.original.timestamp);
        },
      },
      {
        id: "lectura",
        header: "Lectura (m³)",
        cell: ({ row }) => {
          const v = row.original.instantaneous_flow;
          return v != null ? `${v} m³` : "—";
        },
      },
      {
        id: "consumo",
        header: "Consumo calculado",
        cell: ({ row }) => {
          const v = (row.original as any).consumption;
          return v != null ? `${v} m³` : "—";
        },
      },
      {
        id: "operario",
        header: "Operario",
        cell: ({ row }) => {
          const r = row.original as any;
          if (r.submittedBy) {
            return `${r.submittedBy.firstName} ${r.submittedBy.lastName}`.trim();
          }
          return r.submitted_by ?? "—";
        },
      },
      {
        id: "observacion",
        header: "Observación",
        cell: ({ row }) => {
          const v = (row.original as any).observations;
          return v ?? "—";
        },
      },
    ];
  }

  // SMART meter columns
  return [
    {
      accessorKey: "timestamp",
      header: "Fecha y Hora",
      cell: ({ row }) => {
        return formatDateTimeAR(row.original.timestamp);
      },
    },
    {
      accessorKey: "cumulative_flow",
      header: "Flujo acumulado",
      cell: ({ row }) => {
        const value =
          row.original.cumulative_flow ?? row.original.instantaneous_flow;
        return value != null ? `${value} m3` : "N/A";
      },
    },
    {
      id: "instantaneous_flow",
      header: "Flujo instantáneo",
      cell: ({ row }) => {
        const v = row.original.instantaneous_flow;
        return v != null ? `${v} m3` : "N/A";
      },
    },
    {
      accessorKey: "real_time_temperature",
      header: "Temperatura",
      cell: ({ row }) => {
        const v = row.original.real_time_temperature;
        return v != null ? `${v} °C` : "N/A";
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
}

export const readingsColumns = getReadingColumns("SMART");
