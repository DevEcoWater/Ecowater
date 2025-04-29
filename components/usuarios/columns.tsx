"use client";

import { userConfig } from "@/utils/getChipColor";
import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import UserAvatar from "./user-avatar";
import Chip from "../ui/chip";
import { UserActions } from "./user-actions";
import { User } from "@prisma/client";
import { UserColumn } from "@/types/users/user-types";

export const userColumns: ColumnDef<UserColumn>[] = [
  {
    accessorKey: "username",
    header: "Usuario",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <UserAvatar
          firstName={user.firstName}
          lastName={user.lastName}
          role={user.role}
        />
      );
    },
  },
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
      const status = row.original.status as keyof typeof userConfig;
      const { label } = userConfig[status];

      return <Chip status={status} text={label} user />;
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const user = row.original as unknown as User;
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <UserActions
            user={user}
            onViewDetails={(user) => console.log("View details", user)}
            onEdit={(user) => console.log("Edit", user)}
            onViewMeter={(user) => console.log("View meter", user)}
            onDelete={(user) => console.log("Delete", user)}
          />
        </div>
      );
    },
  },
];
