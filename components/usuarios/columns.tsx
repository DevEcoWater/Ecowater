"use client";

import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import UserAvatar from "./user-avatar";
import Chip from "../ui/chip";
import { UserActions } from "./user-actions";
import { User } from "@prisma/client";
import { UserColumn, UserDetail } from "@/types/users/user-types";

const usernameColumn: ColumnDef<UserDetail> = {
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

const otherColumns: ColumnDef<UserColumn>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "createdAt",
    header: "Fecha de registro",
    cell: ({ row }) => {
      const date = row.original.created_at;
      return dayjs(date).format("DD/MM/YYYY");
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
      const user = row.original as User;
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <UserActions user={user} />
        </div>
      );
    },
  },
];

export const userColumns: ColumnDef<UserColumn | UserDetail>[] = [
  usernameColumn,
  ...otherColumns,
];
