"use client";

import type { ColumnDef } from "@tanstack/react-table";
import UserAvatar from "./user-avatar";
import Chip from "../ui/chip";
import { UserActions } from "./user-actions";
import { UserDataForTable, UserDetail } from "@/types/users/user-types";

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
    accessorKey: "created_at",
    header: "Fecha de registro",
    cell: ({ row }) => {
      const date = row.original.created_at;
      return new Date(date).toLocaleDateString("es-ES");
    },
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
    accessorKey: "status",
    header: "Estado del usuario",
    cell: ({ row }) => {
      const status = row.original.status;
      return <Chip status={status} />;
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
