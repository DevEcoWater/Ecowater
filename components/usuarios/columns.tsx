"use client";

import { userConfig, UserStatus } from "@/utils/getChipColor";
import type { MeterStatus } from "@prisma/client";
import type { ColumnDef } from "@tanstack/react-table";
import dayjs from "dayjs";
import UserAvatar from "./user-avatar";
import { User, UserColumn } from "@/types/users/user-types";
import Chip from "../ui/chip";
import { UserActions } from "./user-actions";

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
      const date = row.original.createdAt;
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
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original as unknown as User;
      return (
        <UserActions
          user={user}
          onViewDetails={(user) => console.log("View details", user)}
          onEdit={(user) => console.log("Edit", user)}
          onViewMeter={(user) => console.log("View meter", user)}
          onDelete={(user) => console.log("Delete", user)}
        />
      );
    },
  },
];
