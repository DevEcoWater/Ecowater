"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Chip from "../ui/chip";
import { MeterActions } from "./meter-actions";
import { MeterDataForTable } from "@/types/meters/meter-types";

export const meterColumns: ColumnDef<MeterDataForTable>[] = [
  {
    accessorKey: "dev_eui",
    header: "Codigo del Medidor",
  },
  {
    accessorKey: "created_at",
    header: "Fecha de registro",
    cell: ({ row }) => {
      const date = row.original.created_at;
      return new Date(date).toLocaleDateString("es-ES");
    },
  },
  {
    accessorKey: "updated_at",
    header: "Ultima actualización",
    cell: ({ row }) => {
      const date = row.original.updated_at;
      return new Date(date).toLocaleDateString("es-ES");
    },
  },
  {
    id: "address",
    header: "Dirección del cliente",
    cell: ({ row }) => {
      const shortData = row.original.userMeter?.shortData.split(",")[0];
      return shortData || "Sin dirección";
    },
  },

  {
    accessorKey: "userName",
    header: "Nombre del cliente",
    cell: ({ row }) => {
      return row.original.userMeter?.userName || "Sin asignación";
    },
  },

  {
    accessorKey: "status",
    header: "Estado del medidor",
    cell: ({ row }) => {
      const status = row.original.status;
      return <Chip status={status} />;
    },
  },

  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const meter = row.original;
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <MeterActions meter={meter} />
        </div>
      );
    },
  },
];
