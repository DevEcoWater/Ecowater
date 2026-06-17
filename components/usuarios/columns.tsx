"use client";

import type { ColumnDef } from "@tanstack/react-table";
import UserAvatar from "./user-avatar";
import Chip from "../ui/chip";
import { UserActions } from "./user-actions";
import { UserDataForTable } from "@/types/users/user-types";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";

export const userColumns: ColumnDef<UserDataForTable>[] = [
  {
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
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="truncate max-w-[180px] block text-sm">{row.original.email}</span>
    ),
  },
  {
    id: "address",
    header: "Dirección",
    cell: ({ row }) => {
      const shortData = row.original.address?.data?.split(",")[0];
      return (
        <span className="truncate max-w-[180px] block text-sm">{shortData || "Sin dirección"}</span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => <Chip status={row.original.status} />,
  },
  {
    id: "meter",
    header: "Medidor",
    cell: ({ row }) => {
      const meters = (row.original.userMeters as any) ?? [];
      const hasMeter = Array.isArray(meters) ? meters.length > 0 : !!meters;
      return hasMeter ? (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1 font-medium hover:bg-blue-200 cursor-default">
          <Activity className="h-3 w-3" />
          Asignado
        </Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground gap-1 font-normal">
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
