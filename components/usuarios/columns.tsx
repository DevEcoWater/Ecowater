"use client";

import type { ColumnDef } from "@tanstack/react-table";
import UserAvatar from "./user-avatar";
import Chip from "../ui/chip";
import { UserActions } from "./user-actions";
import { UserDataForTable, UserDetail } from "@/types/users/user-types";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

const usernameColumn: ColumnDef<UserDataForTable> = {
  id: "username",
  header: "Usuario",
  cell: ({ row }) => {
    const user = row.original;
    return (
      <UserAvatar
        firstName={user.firstName}
        lastName={user.lastName}
        role={user.role ?? ""}
      />
    );
  },
};

const otherColumns: ColumnDef<UserDataForTable>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    id: "address",
    header: "Dirección",
    cell: ({ row }) => {
      // split the address data by comma and return the first element
      const shortData = row.original.address.data.split(",")[0];
      return shortData || "Sin dirección";
    },
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
    accessorKey: "status",
    header: "Estado del usuario",
    cell: ({ row }) => {
      const status = row.original.status;
      return <Chip status={status} />;
    },
  },
  {
    id: "meter",
    header: "Medidor",
    cell: ({ row }) => {
      const meters = (row.original.userMeters as any) ?? [];
      const hasMeter = Array.isArray(meters)
        ? meters.length > 0
        : !!meters;
      return hasMeter ? (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1 font-medium hover:bg-blue-200 cursor-default">
          <Activity className="h-3 w-3" />
          Asignado
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="text-muted-foreground gap-1 font-normal">
          <Activity className="h-3 w-3 opacity-40" />
          Sin medidor
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <UserActions user={user} />
        </div>
      );
    },
  },
];

export const userColumns: ColumnDef<UserDataForTable>[] = [
  usernameColumn,
  ...otherColumns,
];
