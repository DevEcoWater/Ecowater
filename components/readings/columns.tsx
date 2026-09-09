"use client";

import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import Chip from "../ui/chip";
import { StatusReading } from "@/types/meters/meter-types";
import { formatDateAR, formatDateTimeAR } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ---------------------------------------------------------------------------
// Photo cell with inline Dialog — only used for MECHANICAL meter rows
// ---------------------------------------------------------------------------

function ReadingPhotoCell({ photoUrl }: { photoUrl: string | null | undefined }) {
  const [open, setOpen] = useState(false);

  if (!photoUrl) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded overflow-hidden border hover:opacity-80 transition-opacity cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Ver foto del medidor"
      >
        <img
          src={photoUrl}
          alt="Foto del medidor"
          className="w-10 h-10 object-cover"
        />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Foto del medidor</DialogTitle>
          </DialogHeader>
          <img
            src={photoUrl}
            alt="Foto del medidor"
            className="w-full rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------------------
// Column definitions
// ---------------------------------------------------------------------------

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
      {
        id: "foto",
        header: "Foto",
        cell: ({ row }) => {
          return (
            <ReadingPhotoCell photoUrl={(row.original as any).photo_url} />
          );
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
